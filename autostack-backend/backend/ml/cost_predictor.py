"""
AI-Powered Cost Prediction Service
Uses time-series forecasting to predict future costs
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

try:
    from prophet import Prophet
    import pandas as pd
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False
    Prophet = None
    pd = None

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False
    np = None

from ..models import CostSnapshot, CostPrediction, Project

logger = logging.getLogger(__name__)


class CostPredictorService:
    """Service for predicting future costs using ML"""
    
    def __init__(self):
        self.model_version = "1.0.0"
    
    async def predict_costs(
        self,
        session: AsyncSession,
        project_id: str,
        user_id: str,
        days_ahead: int = 30
    ) -> Optional[CostPrediction]:
        """Predict future costs for a project"""
        try:
            # Get historical cost data
            start_date = datetime.utcnow() - timedelta(days=90)  # Use last 90 days
            
            query = select(CostSnapshot).where(
                CostSnapshot.project_id == project_id
            ).where(
                CostSnapshot.timestamp >= start_date
            ).order_by(CostSnapshot.timestamp)
            
            result = await session.execute(query)
            snapshots = list(result.scalars().all())
            
            if len(snapshots) < 7:
                logger.warning(f"Not enough data for prediction (need 7+ days, have {len(snapshots)})")
                return await self._create_simple_prediction(session, project_id, user_id, snapshots)
            
            # Use Prophet if available, otherwise use simple moving average
            if PROPHET_AVAILABLE and pd is not None:
                return await self._predict_with_prophet(session, project_id, user_id, snapshots, days_ahead)
            else:
                return await self._predict_with_moving_average(session, project_id, user_id, snapshots, days_ahead)
            
        except Exception as e:
            logger.error(f"Error predicting costs: {e}")
            return None
    
    async def _predict_with_prophet(
        self,
        session: AsyncSession,
        project_id: str,
        user_id: str,
        snapshots: List[CostSnapshot],
        days_ahead: int
    ) -> Optional[CostPrediction]:
        """Predict using Facebook Prophet"""
        try:
            # Prepare data for Prophet
            df = pd.DataFrame([
                {
                    'ds': snapshot.timestamp,
                    'y': snapshot.total_cost
                }
                for snapshot in snapshots
            ])
            
            # Create and fit model
            model = Prophet(
                daily_seasonality=True,
                weekly_seasonality=True,
                yearly_seasonality=False,
                changepoint_prior_scale=0.05
            )
            
            model.fit(df)
            
            # Make future dataframe
            future = model.make_future_dataframe(periods=days_ahead, freq='D')
            forecast = model.predict(future)
            
            # Get predictions
            last_prediction = forecast.iloc[-1]
            daily_prediction = forecast.iloc[-days_ahead:]['yhat'].mean()
            
            # Calculate confidence
            confidence = self._calculate_confidence(df, forecast)
            
            # Create prediction record
            prediction = CostPrediction(
                id=str(uuid.uuid4()),
                project_id=project_id,
                user_id=user_id,
                predicted_daily_cost=daily_prediction,
                predicted_monthly_cost=daily_prediction * 30,
                predicted_yearly_cost=daily_prediction * 365,
                confidence_score=confidence,
                model_version=f"prophet-{self.model_version}",
                prediction_date=datetime.utcnow(),
                days_of_data_used=len(snapshots),
                prediction_metadata={
                    'method': 'prophet',
                    'seasonality': {
                        'daily': True,
                        'weekly': True
                    },
                    'forecast_horizon_days': days_ahead
                }
            )
            
            session.add(prediction)
            await session.commit()
            await session.refresh(prediction)
            
            logger.info(f"Created Prophet prediction for project {project_id}: ${prediction.predicted_monthly_cost:.2f}/month")
            return prediction
            
        except Exception as e:
            logger.error(f"Error in Prophet prediction: {e}")
            return await self._predict_with_moving_average(session, project_id, user_id, snapshots, days_ahead)
    
    async def _predict_with_moving_average(
        self,
        session: AsyncSession,
        project_id: str,
        user_id: str,
        snapshots: List[CostSnapshot],
        days_ahead: int
    ) -> Optional[CostPrediction]:
        """Predict using simple moving average (fallback)"""
        try:
            # Calculate moving average
            recent_costs = [s.total_cost for s in snapshots[-14:]]  # Last 14 days
            daily_avg = sum(recent_costs) / len(recent_costs) if recent_costs else 0.0
            
            # Calculate trend
            if len(recent_costs) >= 7:
                recent_avg = sum(recent_costs[-7:]) / 7
                older_avg = sum(recent_costs[:7]) / 7
                trend_factor = recent_avg / older_avg if older_avg > 0 else 1.0
            else:
                trend_factor = 1.0
            
            # Apply trend to prediction
            predicted_daily = daily_avg * trend_factor
            
            # Calculate confidence based on data variance
            if NUMPY_AVAILABLE and np is not None:
                variance = np.var(recent_costs) if recent_costs else 0.0
                confidence = max(0.5, min(0.95, 1.0 - (variance / (daily_avg ** 2)) if daily_avg > 0 else 0.5))
            else:
                confidence = 0.75  # Default confidence
            
            prediction = CostPrediction(
                id=str(uuid.uuid4()),
                project_id=project_id,
                user_id=user_id,
                predicted_daily_cost=predicted_daily,
                predicted_monthly_cost=predicted_daily * 30,
                predicted_yearly_cost=predicted_daily * 365,
                confidence_score=confidence,
                model_version=f"moving-average-{self.model_version}",
                prediction_date=datetime.utcnow(),
                days_of_data_used=len(snapshots),
                prediction_metadata={
                    'method': 'moving_average',
                    'window_days': 14,
                    'trend_factor': trend_factor
                }
            )
            
            session.add(prediction)
            await session.commit()
            await session.refresh(prediction)
            
            logger.info(f"Created moving average prediction for project {project_id}: ${prediction.predicted_monthly_cost:.2f}/month")
            return prediction
            
        except Exception as e:
            logger.error(f"Error in moving average prediction: {e}")
            return None
    
    async def _create_simple_prediction(
        self,
        session: AsyncSession,
        project_id: str,
        user_id: str,
        snapshots: List[CostSnapshot]
    ) -> Optional[CostPrediction]:
        """Create a simple prediction when not enough data"""
        try:
            if not snapshots:
                daily_cost = 0.0
            else:
                daily_cost = sum(s.total_cost for s in snapshots) / len(snapshots)
            
            prediction = CostPrediction(
                id=str(uuid.uuid4()),
                project_id=project_id,
                user_id=user_id,
                predicted_daily_cost=daily_cost,
                predicted_monthly_cost=daily_cost * 30,
                predicted_yearly_cost=daily_cost * 365,
                confidence_score=0.50,  # Low confidence
                model_version=f"simple-{self.model_version}",
                prediction_date=datetime.utcnow(),
                days_of_data_used=len(snapshots),
                prediction_metadata={
                    'method': 'simple_average',
                    'note': 'Not enough historical data for advanced prediction'
                }
            )
            
            session.add(prediction)
            await session.commit()
            await session.refresh(prediction)
            
            logger.info(f"Created simple prediction for project {project_id}: ${prediction.predicted_monthly_cost:.2f}/month")
            return prediction
            
        except Exception as e:
            logger.error(f"Error creating simple prediction: {e}")
            return None
    
    def _calculate_confidence(self, historical_df, forecast_df) -> float:
        """Calculate prediction confidence score"""
        try:
            if not NUMPY_AVAILABLE or np is None:
                return 0.75
            
            # Calculate MAPE (Mean Absolute Percentage Error) on historical data
            actual = historical_df['y'].values
            predicted = forecast_df.iloc[:len(actual)]['yhat'].values
            
            mape = np.mean(np.abs((actual - predicted) / actual)) * 100
            
            # Convert MAPE to confidence (lower MAPE = higher confidence)
            if mape < 10:
                confidence = 0.95
            elif mape < 20:
                confidence = 0.85
            elif mape < 30:
                confidence = 0.75
            elif mape < 50:
                confidence = 0.65
            else:
                confidence = 0.50
            
            return confidence
            
        except Exception as e:
            logger.error(f"Error calculating confidence: {e}")
            return 0.75
    
    async def get_latest_prediction(
        self,
        session: AsyncSession,
        project_id: str
    ) -> Optional[CostPrediction]:
        """Get the most recent prediction for a project"""
        try:
            query = select(CostPrediction).where(
                CostPrediction.project_id == project_id
            ).order_by(CostPrediction.created_at.desc()).limit(1)
            
            result = await session.execute(query)
            return result.scalar_one_or_none()
            
        except Exception as e:
            logger.error(f"Error getting latest prediction: {e}")
            return None
    
    async def update_prediction_if_needed(
        self,
        session: AsyncSession,
        project_id: str,
        user_id: str
    ) -> Optional[CostPrediction]:
        """Update prediction if it's older than 24 hours"""
        try:
            latest = await self.get_latest_prediction(session, project_id)
            
            if not latest or (datetime.utcnow() - latest.created_at) > timedelta(hours=24):
                # Create new prediction
                return await self.predict_costs(session, project_id, user_id)
            
            return latest
            
        except Exception as e:
            logger.error(f"Error updating prediction: {e}")
            return None


# Global instance
cost_predictor = CostPredictorService()
