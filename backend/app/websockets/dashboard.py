import asyncio
import json
from typing import List, Dict, Any
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from fastapi.encoders import jsonable_encoder
from app.database import get_async_db
from app.routers.reports import get_dashboard_stats, get_branch_performance, get_inventory_status

class DashboardWebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.update_task = None

    async def connect(self, websocket: WebSocket):
        print(f"DEBUG: DashboardWebSocketManager.connect called for client: {websocket.client}")
        try:
            await websocket.accept()
            print(f"DEBUG: websocket.accept() successful for client: {websocket.client}")
            self.active_connections.append(websocket)
            # Start the update task only if it's the first connection 
            # or if the previous task has finished (e.g., due to an error or cancellation).
            if self.update_task is None or self.update_task.done():
                if self.update_task and self.update_task.done():
                    try:
                        self.update_task.result() # Retrieve exception if task died with one
                    except Exception as e_task_done:
                        print(f"DEBUG: Previous broadcast_updates task finished with error: {e_task_done}")
                print(f"DEBUG: Starting new broadcast_updates task. Active connections: {len(self.active_connections)}")
                self.update_task = asyncio.create_task(self.broadcast_updates())
            else:
                print(f"DEBUG: broadcast_updates task already running. Active connections: {len(self.active_connections)}")
        except Exception as e_accept:
            print(f"DEBUG: Error during websocket.accept() in manager for {websocket.client}: {e_accept}")
            # Important: Re-raise the exception so the endpoint in main.py can catch it
            # and potentially close the websocket gracefully or log it more visibly at the ASGI level.
            raise

    def disconnect(self, websocket: WebSocket):
        print(f"DEBUG: DashboardWebSocketManager.disconnect called for client: {websocket.client}")
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
        import asyncio # Already imported, but good to note
        stats_data, branch_performance_data, inventory_status_data = None, None, None
        error_info = None
        fetched_stats, fetched_branch_performance, fetched_inventory_status = None, None, None

        try:
            try:
                # Attempt to get and await stats_data
                _stats_coro = get_dashboard_stats(db=db, days=30)
                if asyncio.iscoroutine(_stats_coro):
                    fetched_stats = await _stats_coro
                else:
                    fetched_stats = _stats_coro # Should not happen if get_dashboard_stats is async
            except Exception as e:
                print(f"Error in get_dashboard_stats: {type(e).__name__} - {str(e)}")
                error_info = f"Error in get_dashboard_stats: {type(e).__name__} - {str(e)}"
                # Do not assign to fetched_stats, it remains None or its last good value
                raise

            try:
                # Attempt to get and await branch_performance_data
                _branch_perf_coro = get_branch_performance(db=db)
                if asyncio.iscoroutine(_branch_perf_coro):
                    fetched_branch_performance = await _branch_perf_coro
                else:
                    fetched_branch_performance = _branch_perf_coro # Should not happen
            except Exception as e:
                print(f"Error in get_branch_performance: {type(e).__name__} - {str(e)}")
                error_info = f"Error in get_branch_performance: {type(e).__name__} - {str(e)}"
                raise

            try:
                # Attempt to get and await inventory_status_data
                _inventory_coro = get_inventory_status(db=db)
                if asyncio.iscoroutine(_inventory_coro):
                    fetched_inventory_status = await _inventory_coro
                else:
                    fetched_inventory_status = _inventory_coro # Should not happen
            except Exception as e:
                print(f"Error in get_inventory_status: {type(e).__name__} - {str(e)}")
                error_info = f"Error in get_inventory_status: {type(e).__name__} - {str(e)}"
                raise
            
            return {
                "stats": fetched_stats,
                "branchPerformance": fetched_branch_performance,
                "inventoryStatus": fetched_inventory_status
            }
        except Exception as e: # Outer catch for any of the above
            print(f"Overall error in get_dashboard_data, likely from one of the above: {type(e).__name__} - {str(e)}")
            # Ensure all potentially problematic fields are serializable before returning
            # Use the fetched_ values which would be None if their await failed or the coroutine itself if not awaited.
            # The goal is to return the data that *was* successfully fetched.
            return {
                "stats": fetched_stats if not asyncio.iscoroutine(fetched_stats) else {"error": f"Failed to load stats: {type(e).__name__}"},
                "branchPerformance": fetched_branch_performance if not asyncio.iscoroutine(fetched_branch_performance) else {"error": f"Failed to load branch performance: {type(e).__name__}"},
                "inventoryStatus": fetched_inventory_status if not asyncio.iscoroutine(fetched_inventory_status) else {"error": f"Failed to load inventory status: {type(e).__name__}"},
                "error": error_info or f"Overall error in get_dashboard_data: {type(e).__name__} - {str(e)}"
            }

    def _convert_decimal_to_float(self, obj):
        """Recursively convert Decimal objects to float and Pydantic models to dicts."""
        import decimal # Keep import local if only used here

        if isinstance(obj, decimal.Decimal):
            return float(obj)
        # Check for Pydantic BaseModel instances after specific types like Decimal
        # to ensure models containing Decimals are also processed correctly.
        if isinstance(obj, BaseModel):
            # Use jsonable_encoder to convert Pydantic models to dicts.
            # This ensures that they are in a serializable dict form.
            # The encoder handles nested models and other complex types within the model.
            return jsonable_encoder(obj)
        if isinstance(obj, dict):
            return {k: self._convert_decimal_to_float(v) for k, v in obj.items()}
        if isinstance(obj, list) or isinstance(obj, tuple):
            # Convert to list comprehension to build a new list
            return [self._convert_decimal_to_float(i) for i in obj]
        
        # For all other types, return as is
        return obj

# Create a singleton instance
dashboard_manager = DashboardWebSocketManager()
