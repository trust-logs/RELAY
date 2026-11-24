-- RELAY AI execution plan handoff and non-recursive project membership policies.
create table if not exists public.request_execution_plans (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  title text not null,
  summary text not null default '',
  source text not null default 'rules' check (source in ('rules','ai_gateway')),
  status text not null default 'draft' check (status in ('draft','approved')),
  steps jsonb not null default '[]'::jsonb check (jsonb_typeof(steps) = 'array'),
  provider_needs jsonb not null default '[]'::jsonb check (jsonb_typeof(provider_needs) = 'array'),
  risks jsonb not null default '[]'::jsonb check (jsonb_typeof(risks) = 'array'),
  budget_guidance text not null default '',
  timeline_guidance text not null default '',
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint request_execution_plans_request_unique unique (request_id)
);
create index if not exists request_execution_plans_created_by_idx
  on public.request_execution_plans(created_by, updated_at desc);
alter table public.request_execution_plans enable row level security;
drop policy if exists request_execution_plans_owner_select on public.request_execution_plans;
create policy request_execution_plans_owner_select on public.request_execution_plans
  for select to authenticated using (created_by = (select auth.uid()));
drop policy if exists request_execution_plans_owner_insert on public.request_execution_plans;
create policy request_execution_plans_owner_insert on public.request_execution_plans
  for insert to authenticated with check (
    created_by = (select auth.uid())
    and exists (select 1 from public.requests r where r.id = request_id and r.created_by = (select auth.uid()))
  );
drop policy if exists request_execution_plans_owner_update on public.request_execution_plans;
create policy request_execution_plans_owner_update on public.request_execution_plans
  for update to authenticated
  using (created_by = (select auth.uid()))
  with check (
    created_by = (select auth.uid())
    and exists (select 1 from public.requests r where r.id = request_id and r.created_by = (select auth.uid()))
  );
revoke all on table public.request_execution_plans from anon, public;
revoke all on table public.request_execution_plans from authenticated;
grant select, insert, update on table public.request_execution_plans to authenticated;

-- Break the projects <-> project_members RLS recursion with narrow owner/participant helpers.
create or replace function private.is_project_owner(p_project_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project_id and p.created_by = (select auth.uid())
  );
$$;
revoke all on function private.is_project_owner(uuid) from public, anon;
grant execute on function private.is_project_owner(uuid) to authenticated;

drop policy if exists projects_select_owner_or_member on public.projects;
create policy projects_select_owner_or_member on public.projects
  for select to authenticated using (private.is_project_participant(id));
drop policy if exists project_members_select_self_or_owner on public.project_members;
create policy project_members_select_self_or_owner on public.project_members
  for select to authenticated using (user_id = (select auth.uid()) or private.is_project_owner(project_id));
drop policy if exists project_members_insert_project_owner on public.project_members;
create policy project_members_insert_project_owner on public.project_members
  for insert to authenticated with check (
    added_by = (select auth.uid()) and member_role <> 'owner' and private.is_project_owner(project_id)
  );
drop policy if exists project_members_update_project_owner on public.project_members;
create policy project_members_update_project_owner on public.project_members
  for update to authenticated using (private.is_project_owner(project_id))
  with check (member_role <> 'owner' and private.is_project_owner(project_id));
drop policy if exists project_members_delete_project_owner on public.project_members;
create policy project_members_delete_project_owner on public.project_members
  for delete to authenticated using (private.is_project_owner(project_id));

-- When a customer accepts a provider, turn their previously approved request plan
-- into live project tasks and milestones. The provider membership already exists
-- at this point, so provider-owned tasks can be safely assigned.
create or replace function private.attach_approved_request_plan_to_project()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_project public.projects%rowtype;
  v_plan public.request_execution_plans%rowtype;
  v_step jsonb;
  v_steps jsonb := '[]'::jsonb;
  v_order integer := 0;
  v_assignee uuid;
begin
  if new.member_role <> 'provider' then return new; end if;

  select * into v_project
  from public.projects
  where id = new.project_id
    and created_by = auth.uid()
    and request_id is not null;
  if not found then return new; end if;

  select * into v_plan
  from public.request_execution_plans
  where request_id = v_project.request_id
    and created_by = v_project.created_by
    and status = 'approved';
  if not found then return new; end if;

  if exists (select 1 from public.request_plans where project_id = v_project.id) then
    return new;
  end if;

  for v_step in select value from jsonb_array_elements(v_plan.steps)
  loop
    v_order := v_order + 1;
    v_steps := v_steps || jsonb_build_array(jsonb_build_object(
      'id', 'step-' || v_order,
      'kind', 'task',
      'title', left(coalesce(v_step->>'title','Execution step'),180),
      'description', left(coalesce(v_step->>'description',''),2000)
    ));
    v_assignee := case
      when coalesce(v_step->>'owner','customer') in ('provider','both') then new.user_id
      else null
    end;
    insert into public.tasks (
      project_id, created_by, assigned_to, title, description, sort_order
    ) values (
      v_project.id, v_project.created_by, v_assignee,
      left(coalesce(v_step->>'title','Execution step'),180),
      left(coalesce(v_step->>'description',''),2000), v_order
    );
  end loop;

  if v_order = 0 then return new; end if;

  v_steps := v_steps || jsonb_build_array(
    jsonb_build_object('id','milestone-1','kind','milestone',
      'title','Execution ready to begin',
      'description','The provider has been selected and the project is ready to proceed.'),
    jsonb_build_object('id','milestone-2','kind','milestone',
      'title','Work completed and ready for review',
      'description','The provider has submitted the agreed result for customer review.')
  );

  insert into public.project_milestones (project_id,created_by,title,description,sort_order)
  values
    (v_project.id,v_project.created_by,'Execution ready to begin',
     'The provider has been selected and the project is ready to proceed.',1),
    (v_project.id,v_project.created_by,'Work completed and ready for review',
     'The provider has submitted the agreed result for customer review.',2);

  insert into public.request_plans (project_id,created_by,title,summary,source,status,steps,approved_at)
  values (
    v_project.id,v_project.created_by,v_plan.title,v_plan.summary,
    case when v_plan.source = 'ai_gateway' then 'ai' else 'rules' end,
    'approved',v_steps,coalesce(v_plan.approved_at,now())
  );
  return new;
end;
$$;
drop trigger if exists trg_attach_approved_request_plan_to_project on public.project_members;
create trigger trg_attach_approved_request_plan_to_project
  after insert on public.project_members
  for each row execute function private.attach_approved_request_plan_to_project();
revoke all on function private.attach_approved_request_plan_to_project() from public, anon;
grant execute on function private.attach_approved_request_plan_to_project() to authenticated;


-- Create the owner membership through a narrow, authenticated trigger.
-- The old invoker trigger attempted an INSERT forbidden by the owner-only policy.
create or replace function private.add_project_owner_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or new.created_by <> auth.uid() then
    raise exception 'Only the authenticated project creator can create the owner membership';
  end if;
  insert into public.project_members (project_id,user_id,member_role,added_by)
  values (new.id,new.created_by,'owner',new.created_by)
  on conflict (project_id,user_id) do nothing;
  return new;
end;
$$;
revoke all on function private.add_project_owner_member() from public, anon;
grant execute on function private.add_project_owner_member() to authenticated;
drop trigger if exists projects_add_owner_member on public.projects;
drop trigger if exists trg_add_project_owner_member on public.projects;
create trigger trg_add_project_owner_member
  after insert on public.projects
  for each row execute function private.add_project_owner_member();
revoke all on function public.add_project_owner_member() from public, anon, authenticated;
