"""
SpecForge AI — Crew 組裝與 LLM 設定
負責建立 langchain 的 LLM 實例並組合 Agents 與 Tasks
"""

import os
from crewai import Crew, Process, Task, LLM

from backend.core.config import get_settings
from backend.core.workflow import ProjectWorkflowManager

# 匯入各個 Agent 的實例化函數
from backend.agents.ba_agent import create_ba_agent
from backend.agents.pm_agent import create_pm_agent
from backend.agents.architect_agent import create_architect_agent
from backend.agents.writer_agent import create_writer_agent


def get_crewai_llm():
    """
    根據系統設定，返回對應的 LangChain LLM 實例，供 CrewAI 使用
    """
    settings = get_settings()
    provider = settings.llm_provider.lower()

    if provider == "ollama":
        return LLM(
            model=f"ollama/{settings.llm_model}",
            base_url=settings.ollama_base_url,
        )
    elif provider == "openai":
        return LLM(
            model=settings.openai_model,
            api_key=settings.openai_api_key,
        )
    elif provider == "google":
        return LLM(
            model=f"gemini/{settings.google_model}",
            api_key=settings.google_api_key,
        )
    elif provider == "openrouter":
        return LLM(
            model=f"openrouter/{settings.openrouter_model}",
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.openrouter_api_key,
        )
    elif provider == "nvidia":
        return LLM(
            model=settings.nvidia_model,
            base_url=settings.nvidia_base_url,
            api_key=settings.nvidia_api_key,
        )
    elif provider == "custom":
        return LLM(
            model=settings.custom_llm_model,
            base_url=settings.custom_llm_base_url,
            api_key=settings.custom_llm_api_key or "no-key",
        )
    else:
        # 預設回退為 Ollama
        return ChatOpenAI(
            base_url=settings.ollama_base_url,
            api_key="ollama",
            model=settings.llm_model,
        )


async def run_crew_workflow(project_id: int):
    """
    在背景任務中執行 CrewAI 流程
    """
    session = ProjectWorkflowManager.get_session(project_id)
    
    try:
        llm = get_crewai_llm()
        
        # 建立 Agents (傳入 project_id 以供 AskUserTool 使用)
        ba_agent = create_ba_agent(llm, project_id)
        pm_agent = create_pm_agent(llm, project_id)
        architect_agent = create_architect_agent(llm, project_id)
        writer_agent = create_writer_agent(llm, project_id)
        
        # 定義 Tasks 並設定產出檔案路徑 (依用戶要求存放在 docs 資料夾下)
        docs_dir = os.path.join(os.getcwd(), "docs")
        os.makedirs(docs_dir, exist_ok=True)
        
        intent_analysis_task = Task(
            description="透過 5 Whys 框架與使用者對話，發掘其真實的系統開發需求與商業意圖。最後產出結構化的意圖報告。",
            expected_output="一份完整的 intent_report.md 報告",
            agent=ba_agent,
            output_file=os.path.join(docs_dir, f"intent_report_{project_id}.md")
        )
        
        proposal_task = Task(
            description="根據意圖報告，盤點所需功能，並與使用者確認 MVP 範圍與技術選型，最後提出需求提案。",
            expected_output="一份完整的 proposal.md 提案",
            agent=pm_agent,
            output_file=os.path.join(docs_dir, f"proposal_{project_id}.md")
        )
        
        architecture_task = Task(
            description="分析需求提案，設計系統技術架構，包含 Mermaid 圖表，並拆解出具體的開發任務清單。",
            expected_output="系統架構設計與開發任務清單",
            agent=architect_agent,
            output_file=os.path.join(docs_dir, f"design_and_tasks_{project_id}.md")
        )
        
        writing_task = Task(
            description="彙整前面所有階段的產出，撰寫並驗證符合 OpenSpec 標準的規格文件。",
            expected_output="最終的 OpenSpec 規格文件",
            agent=writer_agent,
            output_file=os.path.join(docs_dir, f"final_specs_{project_id}.md")
        )
        
        # 建立 Crew
        crew = Crew(
            agents=[ba_agent, pm_agent, architect_agent, writer_agent],
            tasks=[intent_analysis_task, proposal_task, architecture_task, writing_task],
            process=Process.sequential, # 依序執行
            verbose=True
        )
        
        import asyncio
        print(f"[{project_id}] 準備啟動 CrewAI...")
        # 開始執行 (CrewAI kickoff 是同步阻塞函式，必須在獨立 thread 中執行)
        result = await asyncio.to_thread(crew.kickoff)
        print(f"[{project_id}] CrewAI 執行完畢！")
        
        # 執行完成後，通知前端
        await session.enqueue_sse_event(
            event_type="phase_complete",
            data={"message": "所有規格流程已完成", "result": str(result)}
        )
    except Exception as e:
        print(f"[{project_id}] 執行錯誤: {e}")
        await session.enqueue_sse_event(
            event_type="error",
            data={"message": f"Agent 執行時發生錯誤: {str(e)}"}
        )
    finally:
        # 執行完畢，可以選擇清理 session 或保留供後續檢視
        pass
