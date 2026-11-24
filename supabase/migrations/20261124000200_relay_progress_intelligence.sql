-- RELAY Progress Intelligence: task blockers, review gate and task-linked evidence.
alter table public.tasks add column if not exists blocked_reason text, add column if not exists completion_note text, add column if not exists completion_submitted_at timestamptz, add column if not exists reviewed_at timestamptz;
alter table public.project_attachments add column if not exists task_id uuid references public.tasks(id) on delete set null;
create index if not exists project_attachments_task_id_idx on public.project_attachments(task_id) where task_id is not null;
create index if not exists tasks_project_status_due_idx on public.tasks(project_id,status,due_at);
alter table public.tasks drop constraint if exists tasks_status_check;
alter table public.tasks add constraint tasks_status_check check (status = any (array['todo','in_progress','blocked','awaiting_review','completed','cancelled']::text[]));
alter table public.tasks drop constraint if exists tasks_blocked_reason_check;
alter table public.tasks add constraint tasks_blocked_reason_check check (status <> 'blocked' or (blocked_reason is not null and char_length(trim(blocked_reason)) >= 3));
create or replace function private.guard_task_completion_review()
returns trigger language plpgsql security invoker set search_path = ''
as $$
declare v_owner uuid;
begin
 select p.created_by into v_owner from public.projects p where p.id=new.project_id;
 if new.status='completed' and old.status<>'completed' and auth.uid() is distinct from v_owner then raise exception 'Only the customer can approve task completion'; end if;
 if new.status='awaiting_review' then
   if new.assigned_to is distinct from auth.uid() then raise exception 'Only the assigned provider can submit work for review'; end if;
   new.completion_submitted_at:=coalesce(new.completion_submitted_at,now());
 end if;
 if new.status='blocked' and (new.blocked_reason is null or char_length(trim(new.blocked_reason))<3) then raise exception 'A short reason is required when blocking a task'; end if;
 if new.status<>'blocked' then new.blocked_reason:=null; end if;
 if new.status='completed' then new.completed_at:=coalesce(new.completed_at,now()); new.reviewed_at:=coalesce(new.reviewed_at,now());
 elsif old.status='completed' and new.status<>'completed' then new.completed_at:=null; new.reviewed_at:=null; end if;
 new.updated_at:=now(); return new;
end; $$;
drop trigger if exists trg_guard_task_completion_review on public.tasks;
create trigger trg_guard_task_completion_review before update of status,blocked_reason,completion_submitted_at on public.tasks for each row execute function private.guard_task_completion_review();
revoke all on function private.guard_task_completion_review() from public,anon,authenticated;
create or replace function private.notify_task_update()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare v_title text; v_body text; v_actor uuid; v_type text; v_heading text;
begin
 v_actor:=auth.uid();
 if new.status is distinct from old.status or new.assigned_to is distinct from old.assigned_to then
  select p.title into v_title from public.projects p where p.id=new.project_id;
  v_body:=coalesce(v_title,'Project')||': '||new.title||' — '||new.status;
  v_type:=case when new.status='blocked' then 'task_blocked' when new.status='awaiting_review' then 'task_review_requested' else 'task_updated' end;
  v_heading:=case when new.status='blocked' then 'A task is blocked' when new.status='awaiting_review' then 'Work submitted for review' else 'A project task changed' end;
  perform private.emit_notification(recipient.user_id,v_actor,new.project_id,null,v_type,v_heading,
   v_body||case when new.status='blocked' then ' Reason: '||coalesce(new.blocked_reason,'Not provided') else '' end,
   '/dashboard/projects/'||new.project_id::text)
  from (select distinct unnest(array[new.created_by,new.assigned_to,(select p.created_by from public.projects p where p.id=new.project_id)]) as user_id) recipient
  where recipient.user_id is not null;
 end if;
 return new;
end; $$;
