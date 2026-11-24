"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Message = { id:string; sender_id:string; body:string; message_type:string; created_at:string };
type Attachment = { id:string; uploaded_by:string; file_name:string; object_path:string; mime_type:string; file_size:number; created_at:string; task_id?:string|null; signedUrl?:string };
type Props = { projectId:string; userId:string; initialMessages:Message[]; initialAttachments:Attachment[]; taskOptions:{id:string;title:string}[]; names:Record<string,string> };
const MAX_FILE_SIZE=10*1024*1024;
const ALLOWED_TYPES=["image/jpeg","image/png","image/webp","application/pdf"];

export default function ProjectLiveUpdates({projectId,userId,initialMessages,initialAttachments,taskOptions,names}:Props) {
  const supabase=useMemo(()=>createClient(),[]);
  const [messages,setMessages]=useState(initialMessages);
  const [attachments,setAttachments]=useState(initialAttachments);
  const [body,setBody]=useState("");
  const [sending,setSending]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [notice,setNotice]=useState("");\n  const [evidenceTaskId,setEvidenceTaskId]=useState("");
  const bottomRef=useRef<HTMLDivElement>(null);

  const loadAttachments=useCallback(async()=>{
    const {data,error}=await supabase.from("project_attachments").select("id,uploaded_by,file_name,object_path,mime_type,file_size,created_at,task_id").eq("project_id",projectId).order("created_at",{ascending:false});
    if(error)return;
    const rows=await Promise.all((data??[]).map(async item=>{
      const {data:link}=await supabase.storage.from("project-evidence").createSignedUrl(item.object_path,300);
      return {...item,signedUrl:link?.signedUrl};
    }));
    setAttachments(rows);
  },[projectId,supabase]);

  useEffect(()=>{
    const channel=supabase.channel(`relay-project-${projectId}`)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"project_messages",filter:`project_id=eq.${projectId}`},payload=>{
        const next=payload.new as Message;
        setMessages(current=>current.some(m=>m.id===next.id)?current:[...current,next]);
      })
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"project_attachments",filter:`project_id=eq.${projectId}`},()=>{void loadAttachments();})
      .subscribe();
    return ()=>{void supabase.removeChannel(channel);};
  },[projectId,supabase,loadAttachments]);

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth",block:"end"});},[messages]);
  useEffect(()=>{void loadAttachments();},[loadAttachments]);

  async function sendMessage(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    const clean=body.trim();
    if(!clean||sending)return;
    setSending(true);setNotice("");
    const {error}=await supabase.from("project_messages").insert({project_id:projectId,sender_id:userId,body:clean,message_type:"message"});
    if(error)setNotice("Message could not be sent. Please try again.");
    else setBody("");
    setSending(false);
  }

  async function uploadFile(event:React.ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0];
    event.target.value="";
    if(!file)return;
    if(!ALLOWED_TYPES.includes(file.type)){setNotice("Choose a JPG, PNG, WEBP image or PDF.");return;}
    if(file.size>MAX_FILE_SIZE){setNotice("Files must be 10 MB or smaller.");return;}
    setUploading(true);setNotice("");
    const extension=file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g,"")||"file";
    const path=`${projectId}/${userId}/${crypto.randomUUID()}.${extension}`;
    const {error:uploadError}=await supabase.storage.from("project-evidence").upload(path,file,{contentType:file.type,upsert:false});
    if(uploadError){setNotice("Upload failed. Please try again.");setUploading(false);return;}
    const {error:recordError}=await supabase.from("project_attachments").insert({
      project_id:projectId,task_id:evidenceTaskId||null,uploaded_by:userId,file_name:file.name.slice(0,240),object_path:path,mime_type:file.type,file_size:file.size
    });
    if(recordError){
      await supabase.storage.from("project-evidence").remove([path]);
      setNotice("The file uploaded but its project record could not be saved. Please retry.");
    }else{
      setNotice("Evidence added to this project.");
      await loadAttachments();
    }
    setUploading(false);
  }

  return <section className="workspace-panel workspace-conversation">
    <div className="workspace-panel-heading"><div><span className="network-category">LIVE PROJECT UPDATES</span><h2>Project conversation</h2></div><span className="live-connection"><i/> LIVE</span></div>
    <div className="workspace-messages">{!messages.length?<p className="workspace-empty">No messages yet. Start the conversation.</p>:messages.map(msg=><article className={`workspace-message ${msg.sender_id===userId?"is-mine":""}`} key={msg.id}><div><strong>{names[msg.sender_id]??"RELAY member"}</strong><small>{new Date(msg.created_at).toLocaleString()}</small></div><p>{msg.body}</p></article>)}<div ref={bottomRef}/></div>
    <form onSubmit={sendMessage} className="workspace-message-form"><textarea value={body} onChange={e=>setBody(e.target.value)} rows={2} required maxLength={4000} placeholder="Send a project update or message…"/><button type="submit" disabled={sending||!body.trim()}>{sending?"Sending…":"Send message ↗"}</button></form>
    <div className="workspace-evidence">
      <div className="workspace-panel-heading"><div><span className="network-category">PROOF OF WORK</span><h2>Project evidence</h2></div><label className="evidence-upload">{uploading?"Uploading…":"＋ Add file"}<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={uploadFile} disabled={uploading}/></label></div>
      <p className="workspace-empty">Share delivery photos, inspection images or PDF documents. Link evidence to a task so the customer can review the exact work. Private to project participants · 10 MB max per file.</p>\n      {taskOptions.length ? <label className="evidence-task-select">Attach evidence to<select value={evidenceTaskId} onChange={e=>setEvidenceTaskId(e.target.value)}><option value="">General project evidence</option>{taskOptions.map(task=><option key={task.id} value={task.id}>{task.title}</option>)}</select></label> : null}
      {attachments.length?<div className="workspace-evidence-list">{attachments.map(file=><a className="workspace-evidence-item" key={file.id} href={file.signedUrl??"#"} target="_blank" rel="noreferrer"><span className="evidence-file-icon">{file.mime_type==="application/pdf"?"PDF":"IMG"}</span><span><strong>{file.file_name}</strong><small>{(file.file_size/1024/1024).toFixed(2)} MB · {names[file.uploaded_by]??"RELAY member"}{file.task_id ? ` · ${taskOptions.find(t=>t.id===file.task_id)?.title??"Task evidence"}` : " · General project evidence"} · {new Date(file.created_at).toLocaleDateString()}</small></span><b>↗</b></a>)}</div>:<p className="workspace-empty">No evidence files shared yet.</p>}
    </div>
    {notice?<p className="workspace-live-notice" role="status">{notice}</p>:null}
  </section>;
}
