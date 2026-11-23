"use client";

import { useState } from "react";
import { approveProjectPlan, saveProjectPlan, generateProjectPlan } from "@/app/actions/planning";

export type PlanStep = { id: string; kind: "task" | "milestone"; title: string; description: string };
type Plan = { id:string; title:string; summary:string; source:string; status:string; steps:PlanStep[] };
export default function ProjectPlanBuilder({projectId,plan,isOwner}:{projectId:string;plan:Plan|null;isOwner:boolean}) {
  const [title,setTitle]=useState(plan?.title??"");
  const [summary,setSummary]=useState(plan?.summary??"");
  const [steps,setSteps]=useState<PlanStep[]>(plan?.steps??[]);
  const update=(index:number,field:"title"|"description"|"kind",value:string)=>{
    setSteps(current=>current.map((step,i)=>i===index?{...step,[field]:value}:step));
  };
  const move=(index:number,delta:number)=>{
    setSteps(current=>{const next=[...current];const target=index+delta;if(target<0||target>=next.length)return current;[next[index],next[target]]=[next[target],next[index]];return next;});
  };
  const remove=(index:number)=>setSteps(current=>current.filter((_,i)=>i!==index));
  const add=()=>setSteps(current=>[...current,{id:`custom-${Date.now()}`,kind:"task",title:"New step",description:"Add the details for this step."}]);
  if(!plan) return <section className="plan-builder plan-builder-empty">
    <div><span className="network-category">RELAY PLANNING ENGINE</span><h2>Turn the outcome into a plan.</h2><p>RELAY can draft an ordered checklist and key checkpoints from the project brief. You can edit every step before anything is added to the live workspace.</p></div>
    {isOwner?<form action={generateProjectPlan}><input type="hidden" name="project_id" value={projectId}/><button className="plan-primary-button" type="submit">✳ Generate suggested plan</button></form>:<small>The customer can generate and approve the execution plan.</small>}
  </section>;
  return <section className="plan-builder">
    <div className="plan-builder-heading"><div><span className="network-category">RELAY PLANNING ENGINE · {plan.source==="ai"?"AI GENERATED":"RULES GENERATED"}</span><h2>{plan.status==="approved"?"Approved execution plan":"Suggested execution plan"}</h2><p>{plan.status==="approved"?"These steps were approved by the project owner and added to the workspace.":"Review the suggested sequence. Edit, remove, reorder or add steps before approving it."}</p></div><span className={`plan-status plan-status-${plan.status}`}>{plan.status}</span></div>
    {plan.status==="draft" && isOwner ? <form action={saveProjectPlan} className="plan-editor">
      <input type="hidden" name="project_id" value={projectId}/><input type="hidden" name="plan_id" value={plan.id}/><input type="hidden" name="steps" value={JSON.stringify(steps)}/>
      <label>Plan name<input name="title" value={title} onChange={e=>setTitle(e.target.value)} required minLength={2} maxLength={180}/></label>
      <label>What this plan aims to achieve<textarea name="summary" value={summary} onChange={e=>setSummary(e.target.value)} rows={2} maxLength={2000}/></label>
      <div className="plan-step-list">{steps.map((step,index)=><article className="plan-step" key={step.id}>
        <div className="plan-step-top"><span>{String(index+1).padStart(2,"0")}</span><div className="plan-step-controls"><button type="button" onClick={()=>move(index,-1)} disabled={index===0} aria-label="Move step up">↑</button><button type="button" onClick={()=>move(index,1)} disabled={index===steps.length-1} aria-label="Move step down">↓</button><button type="button" onClick={()=>remove(index)} aria-label="Remove step">×</button></div></div>
        <label>Step title<input value={step.title} onChange={e=>update(index,"title",e.target.value)} required minLength={2} maxLength={180}/></label>
        <label>Details<textarea value={step.description} onChange={e=>update(index,"description",e.target.value)} rows={2} maxLength={2000}/></label>
        <label>Step type<select value={step.kind} onChange={e=>update(index,"kind",e.target.value)}><option value="task">Action / task</option><option value="milestone">Milestone / checkpoint</option></select></label>
      </article>)}</div>
      <div className="plan-editor-actions"><button type="button" className="plan-secondary-button" onClick={add} disabled={steps.length>=20}>＋ Add a step</button><button type="submit" className="plan-secondary-button">Save changes</button></div>
    </form>:<div className="plan-readonly-list">{steps.map((step,index)=><article className="plan-readonly-step" key={step.id}><span>{String(index+1).padStart(2,"0")}</span><div><strong>{step.title}</strong><p>{step.description}</p></div><small>{step.kind==="milestone"?"CHECKPOINT":"TASK"}</small></article>)}</div>}
    {plan.status==="draft"&&isOwner?<div className="plan-approve-row"><p>Approving adds these tasks and milestones to the shared project. It does not approve extra spending or change the accepted provider quote.</p><form action={approveProjectPlan}><input type="hidden" name="project_id" value={projectId}/><input type="hidden" name="plan_id" value={plan.id}/><button className="plan-primary-button" type="submit" disabled={steps.length<2||!steps.some(s=>s.kind==="task")||!steps.some(s=>s.kind==="milestone")}>Approve plan & create tasks ↗</button></form></div>:null}
    {plan.status==="approved"?<div className="plan-approved-note">✓ Approved steps have been added to the task and milestone lists below.</div>:null}
    <small className="plan-disclaimer">Suggested by RELAY using request details. Review all instructions before approval. No AI provider is connected yet.</small>
  </section>;
}
