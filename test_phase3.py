import asyncio
import httpx
import json
import sys

BASE_URL = "http://127.0.0.0:8000"  # We will test on localhost:8000

async def main():
    print("🚀 開始驗收 Phase 3 Agent 邏輯...")
    
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000", timeout=None) as client:
        # 1. 註冊/登入 (為了取得 JWT Token)
        print("\n[1] 正在建立測試帳號與取得 Token...")
        # 這裡我們為了方便，直接打註冊或登入。我們隨機產生一個帳號
        import uuid
        test_user = f"test_{uuid.uuid4().hex[:6]}"
        test_pass = "password123"
        
        # 註冊
        reg_res = await client.post("/api/auth/register", json={
            "username": test_user,
            "password": test_pass,
            "display_name": "Test User"
        })
        
        # 登入取得 Token
        login_res = await client.post("/api/auth/login", json={
            "username": test_user,
            "password": test_pass
        })
        
        if login_res.status_code != 200:
            print(f"❌ 登入失敗: {login_res.text}")
            return
            
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print(f"✅ 登入成功，取得 Token")

        # 2. 建立新專案
        print("\n[2] 正在建立測試專案...")
        proj_res = await client.post("/api/projects", headers=headers, json={
            "name": "Phase 3 測試專案",
            "description": "測試 Agent 互動邏輯"
        })
        project_id = proj_res.json()["id"]
        print(f"✅ 專案建立成功 (ID: {project_id})")

        # 3. 準備接收 SSE
        print("\n[3] 準備啟動 Agent 流程與 SSE 接收器...")
        
        # 啟動 Agent
        start_res = await client.post(f"/api/projects/{project_id}/start", headers=headers)
        print(f"✅ Agent 已在背景啟動: {start_res.json()['message']}")
        
        print("\n⏳ 正在監聽 SSE 串流 (等待 Agent 提問)...\n" + "-"*40)
        
        # 為了模擬前端接收 SSE，我們開啟一個 stream 請求
        async with client.stream("GET", f"/api/projects/{project_id}/stream?token={token}", timeout=None) as response:
            async for line in response.aiter_lines():
                if not line:
                    continue
                if line.startswith("data: "):
                    data_str = line[6:]
                    try:
                        data = json.loads(data_str)
                        # 我們關注 agent_question 事件
                        if "content" in data and "agent" in data:
                            print(f"\n🤖 [{data['agent']} Agent 提問]:\n{data['content']}")
                            
                            # 模擬使用者在終端機回覆
                            user_input = input("\n👤 你的回覆 (輸入 exit 離開): ")
                            if user_input.lower() == 'exit':
                                print("👋 離開測試程式。")
                                return
                                
                            # 將使用者的回答發送給 backend 的 /reply 端點
                            await client.post(
                                f"/api/projects/{project_id}/reply", 
                                headers=headers, 
                                json={"text": user_input}
                            )
                            print("✅ 回覆已送出，等待 Agent 下一步動作...")
                            
                        elif "message" in data:
                            print(f"ℹ️  [系統訊息]: {data['message']}")
                    except json.JSONDecodeError:
                        pass

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n測試結束")
