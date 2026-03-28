import numpy as np

# Mock Providers Database (Metrics: Cost($/hr), Latency(ms), Throughput(Gbps), Reliability(%), SecurityScore(1-10), Sustainability(1-100))
# Real-time simulation logic will add tiny noises to these base values.
PROVIDERS_BASE = {
    "AWS": {"Cost": 0.05, "Latency": 20, "Throughput": 10, "Reliability": 99.99, "SecurityScore": 9, "Sustainability": 85},
    "Google Cloud": {"Cost": 0.045, "Latency": 25, "Throughput": 8, "Reliability": 99.95, "SecurityScore": 9.5, "Sustainability": 98},
    "Azure": {"Cost": 0.048, "Latency": 22, "Throughput": 9, "Reliability": 99.98, "SecurityScore": 8.5, "Sustainability": 92},
    "DigitalOcean": {"Cost": 0.02, "Latency": 40, "Throughput": 5, "Reliability": 99.9, "SecurityScore": 7, "Sustainability": 60},
    "Linode": {"Cost": 0.022, "Latency": 38, "Throughput": 6, "Reliability": 99.9, "SecurityScore": 7.5, "Sustainability": 65},
    "IBM Cloud": {"Cost": 0.06, "Latency": 18, "Throughput": 12, "Reliability": 99.99, "SecurityScore": 10, "Sustainability": 80},
    "Vultr": {"Cost": 0.015, "Latency": 45, "Throughput": 4, "Reliability": 99.8, "SecurityScore": 6.5, "Sustainability": 55},
    "Oracle Cloud": {"Cost": 0.04, "Latency": 28, "Throughput": 7, "Reliability": 99.95, "SecurityScore": 8.5, "Sustainability": 70},
    "Alibaba Cloud": {"Cost": 0.035, "Latency": 35, "Throughput": 6, "Reliability": 99.9, "SecurityScore": 8, "Sustainability": 65},
    "Heroku": {"Cost": 0.08, "Latency": 15, "Throughput": 8, "Reliability": 99.95, "SecurityScore": 8.5, "Sustainability": 75},
}

# file_path = "cloud_providers.xlsx"
# PROVIDERS_BASE = load_providers_from_excel(file_path)

# Criteria characteristics: True if higher is better, False if lower is better.
CRITERIA_NATURE = {
    "Cost": False,
    "Latency": False,
    "Throughput": True,
    "Reliability": True,
    "SecurityScore": True,
    "Sustainability": True
}

def compute_ahp_weights(user_weights: dict):
    # Simplified AHP: normalize the user's explicit weights (1-10 scale usually)
    # The AHP Process normally builds a pairwise comparison matrix, but often in dynamic web apps
    # we simulate the consistency ratio logic by directly normalizing direct pairwise derived points.
    total = sum(user_weights.values())
    # Normalize to get final weight vector [w1, w2, w3...]
    normalized_weights = {k: v / total for k, v in user_weights.items()}
    return normalized_weights


def simulate_real_time_data():
    real_time_data = {}
    for provider, metrics in PROVIDERS_BASE.items():
        real_time_data[provider] = {
            # Adding up to +/- 5% noise
            "Cost": metrics["Cost"] * np.random.uniform(0.95, 1.05),
            "Latency": metrics["Latency"] * np.random.uniform(0.95, 1.05),
            "Throughput": metrics["Throughput"] * np.random.uniform(0.95, 1.05),
            "Reliability": min(100.0, metrics["Reliability"] * np.random.uniform(0.999, 1.001)),
            "SecurityScore": min(10.0, metrics["SecurityScore"] * np.random.uniform(0.98, 1.02)),
            "Sustainability": min(100.0, metrics["Sustainability"] * np.random.uniform(0.98, 1.02))
        }
    return real_time_data


def apply_saw(providers_data, weights):
    # Simple Additive Weighting
    criteria = list(weights.keys())
    matrix = np.array([[data[c] for c in criteria] for data in providers_data.values()])
    
    # Normalization phase
    normalized_matrix = np.zeros_like(matrix)
    for i, c in enumerate(criteria):
        col = matrix[:, i]
        if CRITERIA_NATURE[c]: # Benefit criteria
            normalized_matrix[:, i] = col / np.max(col)
        else: # Cost criteria
            normalized_matrix[:, i] = np.min(col) / col
            
    # Weighting phase
    weight_vector = np.array([weights[c] for c in criteria])
    scores = np.dot(normalized_matrix, weight_vector)
    
    # Combine with names
    ranked_providers = []
    for idx, (provider, data) in enumerate(providers_data.items()):
        ranked_providers.append({
            "provider": provider,
            "score": float(scores[idx]),
            "metrics": data
        })
        
    # Sort descending based on score
    ranked_providers.sort(key=lambda x: x["score"], reverse=True)
    return ranked_providers


def process_ranking(user_raw_weights):
    weights = compute_ahp_weights(user_raw_weights)
    rt_data = simulate_real_time_data()
    top_10 = apply_saw(rt_data, weights)[:10]
    return top_10

def process_hybrid_ranking(user_raw_weights):
    weights = compute_ahp_weights(user_raw_weights)
    rt_data = simulate_real_time_data()
    
    # Perturb weights for optimal subsystem composition
    front_weights = weights.copy()
    front_weights["Latency"] *= 2.0
    front_weights["Throughput"] *= 2.0
    
    db_weights = weights.copy()
    db_weights["Reliability"] *= 2.0
    db_weights["SecurityScore"] *= 2.0
    
    # Re-normalize
    front_weights = compute_ahp_weights(front_weights)
    db_weights = compute_ahp_weights(db_weights)
    
    front_rank = apply_saw(rt_data, front_weights)
    db_rank = apply_saw(rt_data, db_weights)
    
    # Ensure they suggest two different clouds to demonstrate Hybrid if possible
    db_choice = db_rank[0]
    if db_choice["provider"] == front_rank[0]["provider"]:
        db_choice = db_rank[1]
        
    return {
        "frontend": front_rank[0],
        "database": db_choice
    }

def reverse_seek_provider(target_provider: str, max_cost: float):
    rt_data = simulate_real_time_data()
    
    # Pre-check baseline constraint
    target_data = None
    for p, metrics in rt_data.items():
        if p.lower() == target_provider.lower():
            target_data = metrics
            break
            
    if not target_data:
        return {"status": "error", "message": "Provider not found."}
        
    if target_data["Cost"] > max_cost:
        return {"status": "impossible", "message": f"Constraint Violation: {target_provider} baseline cost (${target_data['Cost']:.3f}/hr) physically exceeds strict budget (${max_cost:.2f}/hr)."}
    
    # Monte Carlo Grid Search (Stochastic Solving)
    for _ in range(5000):
        test_w = {
            "Cost": np.random.randint(1, 11),
            "Latency": np.random.randint(1, 11),
            "Throughput": np.random.randint(1, 11),
            "Reliability": np.random.randint(1, 11),
            "SecurityScore": np.random.randint(1, 11),
            "Sustainability": np.random.randint(1, 11)
        }
        
        normalized = compute_ahp_weights(test_w)
        rankings = apply_saw(rt_data, normalized)
        
        if rankings[0]["provider"].lower() == target_provider.lower():
            return {
                "status": "success",
                "required_weights": test_w,
                "winner": rankings[0]
            }
            
    return {"status": "impossible", "message": f"Could not force {target_provider} to become the #1 mathematically optimal provider within 5000 matrix transformations. Competitors are fundamentally stronger for these metrics."}
