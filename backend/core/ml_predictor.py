import numpy as np
from sklearn.linear_model import LinearRegression

# Mock past dataset for cost vs user growth
# X = User Growth % (e.g. 10 means 10% growth) # Y = Cost Multiplier
X_train = np.array([[0], [5], [10], [20], [50], [100], [200]])
y_train = np.array([1.0, 1.05, 1.12, 1.25, 1.6, 2.1, 3.2])

model = LinearRegression()
model.fit(X_train, y_train)

def forecast_cost_multiplier(growth_percent: float):
    # Predict multiplier for 1, 2, 3, 4, 5, 6 months assuming compound growth
    multipliers = []
    current_growth = growth_percent
    
    for month in range(1, 7):
        pred = model.predict([[current_growth]])[0]
        multipliers.append(max(1.0, pred))
        # compound growth roughly
        current_growth += (growth_percent * 0.2) 
        
    return multipliers
