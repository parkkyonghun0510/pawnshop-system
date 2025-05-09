import asyncio
import json
from typing import List, Dict, Any
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_async_db
from app.routers.reports import get_dashboard_stats, get_branch_performance, get_inventory_status

class DashboardWebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.update_task = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        if len(self.active_connections) == 1:
            # Start the update task when first client connects
            self.update_task = asyncio.create_task(self.broadcast_updates())

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        if len(self.active_connections) == 0 and self.update_task:
            # Cancel the update task when last client disconnects
            self.update_task.cancel()
            self.update_task = None

    async def broadcast_updates(self):
        while True:
            try:
                # Get latest dashboard data using async DB session
                async for db in get_async_db():
                    dashboard_data = await self.get_dashboard_data(db)
                    dashboard_data = self._convert_decimal_to_float(dashboard_data)
                    break  # Only need one session per update
                
                # Send to all connected clients
                for connection in self.active_connections:
                    await connection.send_json(dashboard_data)
                
                # Wait before next update
                await asyncio.sleep(5)  # Update every 5 seconds
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Error in dashboard broadcast: {e}")
                await asyncio.sleep(5)  # Wait before retry

    async def get_dashboard_data(self, db: AsyncSession) -> Dict[str, Any]:
        """Gather all dashboard data"""
        import asyncio
        try:
            stats = get_dashboard_stats(db=db, days=30)
            if asyncio.iscoroutine(stats):
                stats = await stats
            branch_performance = get_branch_performance(db=db)
            if asyncio.iscoroutine(branch_performance):
                branch_performance = await branch_performance
            inventory_status = get_inventory_status(db=db)
            if asyncio.iscoroutine(inventory_status):
                inventory_status = await inventory_status
            
            return {
                "stats": stats,
                "branchPerformance": branch_performance,
                "inventoryStatus": inventory_status
            }
        except Exception as e:
            print(f"Error getting dashboard data: {e}")
            return {
                "stats": None,
                "branchPerformance": None,
                "inventoryStatus": None,
                "error": str(e)
            }

    def _convert_decimal_to_float(self, obj):
        """Recursively convert Decimal objects to float in dicts/lists"""
        import decimal
        if isinstance(obj, dict):
            return {k: self._convert_decimal_to_float(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._convert_decimal_to_float(i) for i in obj]
        elif isinstance(obj, tuple):
            return tuple(self._convert_decimal_to_float(i) for i in obj)
        elif isinstance(obj, decimal.Decimal):
            return float(obj)
        else:
            return obj

# Create a singleton instance
dashboard_manager = DashboardWebSocketManager()
