import os
import requests
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.environ.get("GEMINI_API_KEY")

if API_KEY:
    client = genai.Client(api_key=API_KEY)
else:
    client = None
    
SYSTEM_PROMPT = """You are an expert Cloud Architect. Provide clear, concise, and highly accurate steps. All output should be formatted beautifully in Markdown. Code blocks must be copy-pasteable."""

def extract_github_codebase(github_url: str):
    # Extremely basic direct RAG for public repos
    # We try to pull package.json or requirements.txt from main branch
    if not github_url or "github.com/" not in github_url:
        return ""
        
    parts = github_url.split("github.com/")[-1].split("/")
    if len(parts) >= 2:
        user, repo = parts[0], parts[1]
        
        # Try fetching package.json
        url = f"https://raw.githubusercontent.com/{user}/{repo}/main/package.json"
        res = requests.get(url)
        if res.status_code == 200:
            return f"\n\n--- package.json context loaded securely via GitHub HTTP RAG ---\n{res.text[:1500]}\n"
            
        # Try requirements.txt
        url_py = f"https://raw.githubusercontent.com/{user}/{repo}/main/requirements.txt"
        res_py = requests.get(url_py)
        if res_py.status_code == 200:
             return f"\n\n--- requirements.txt context loaded securely via GitHub HTTP RAG ---\n{res_py.text[:1000]}\n"
             
    return ""

def predict_weights(workload: str):
    prompt = f"""Given the following user workload description: "{workload}", predict optimal AHP priority weights on a scale from 1 to 10 for the following 6 cloud metrics: Cost, Latency, Throughput, Reliability, SecurityScore, Sustainability. 
    Output only valid JSON with these exact keys and integer values from 1 to 10."""
    
    if not client:
        return '{"Cost": 5, "Latency": 5, "Throughput": 5, "Reliability": 5, "SecurityScore": 5, "Sustainability": 5}'
        
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return response.text
    except Exception:
         return '{"Cost": 5, "Latency": 5, "Throughput": 5, "Reliability": 5, "SecurityScore": 5, "Sustainability": 5}'


def generate_cli_deployment(provider_name: str, framework="React/Python", github_url: str = None):
    prompt = f"How do I deploy a {framework} application natively into {provider_name} using ONLY their Command Line Interface (CLI)? "
    if github_url:
        prompt += f"My code is hosted at {github_url}. Analyze its likely stack based on typical structure and provide step-by-step terminal commands including cloning this specific repository."
    else:
        prompt += "Please give me step-by-step terminal commands."
    
    if not client:
        return f"# Error\n\nGoogle Gemini API Key is missing. Could not generate instructions for {provider_name}."
        
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT)
    )
    return response.text


def generate_docker_deployment(provider_name: str, framework="React/Python", github_url: str = None):
    prompt = f"I want to deploy a {framework} application into {provider_name} using a Docker image. First, provide the Dockerfile content to containerize it. Then, provide the step-by-step CLI commands for {provider_name} to push and deploy this image natively."
    if github_url:
        rag_context = extract_github_codebase(github_url)
        if rag_context:
             prompt += f" Adapt these instructions to perfectly encase these exact dependencies I physically extracted from the repository: {rag_context}"
        else:
             prompt += f" Adapt these instructions specifically for the repository at {github_url}."
    
    if not client:
        return f"# Error\n\nGoogle Gemini API Key is missing. Could not generate instructions for {provider_name}."
        
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT)
    )
    return response.text


def generate_iac_deployment(provider_name: str, github_url: str = None):
    prompt = f"Generate a complete Terraform (.tf) Infrastructure as Code script to deploy my application to {provider_name}."
    if github_url:
        rag_context = extract_github_codebase(github_url)
        if rag_context:
            prompt += f" Dynamically sculpt the Terraform virtual machines based on these exact project configuration arrays I successfully scraped: {rag_context}"
        else:
            prompt += f" Ensure the Terraform architecture is tailored for the codebase located at {github_url}."
        
    if not client:
        return f"# Error\n\nGoogle Gemini API Key is missing."
        
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT)
    )
    return response.text


def answer_context_bot(selected_text: str):
    prompt = f"The user selected the following text from our AHP-SAW Cloud Composition platform dashboard: '{selected_text}'. Explain this concept clearly and concisely. Keep it under 3 paragraphs."
    
    if not client:
        return "I need a Gemini API Key to answer that! Please add it to the backend environment variables."
        
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT)
    )
    return response.text


def explain_provider_tradeoffs(p1: dict, p2: dict, p3: dict):
    prompt = f"""Write a 1-paragraph professional Executive Summary comparing the top 3 recommended cloud providers from our latest mathematical analysis.
    Provider 1: {p1['name']} (Score: {p1['score']})
    Provider 2: {p2['name']} (Score: {p2['score']})
    Provider 3: {p3['name']} (Score: {p3['score']})
    Explain broadly why the CEO should proceed with Provider 1, and the potential tradeoffs compared to 2 and 3."""
    
    if not client:
        return "Google Gemini API Key is missing. Executive summary cannot be generated."
        
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(system_instruction="You are a Chief Technology Officer (CTO). Write a serious, convincing 1 paragraph executive summary.")
    )
    return response.text

def generate_compare_opinion(p1_name: str, p1_data: dict, p2_name: str, p2_data: dict):
    prompt = f"""You are a Cloud Infrastructure Architect. The user is directly comparing two cloud providers in a head-to-head match.
    Provider 1: {p1_name} with metrics: {p1_data}
    Provider 2: {p2_name} with metrics: {p2_data}

    Write a decisive 1-2 paragraph final opinion stating exactly which provider is best among the two and why, based strictly on these numerical differences. Do NOT output markdown codeblocks, just the raw text response formatted cleanly."""
    
    if not client:
        return "Google Gemini API Key is missing. Comparison opinion cannot be generated."
        
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(system_instruction="You are a decisive Cloud Infrastructure Architect. Pick a clear winner.")
    )
    return response.text

def generate_hybrid_terraform(frontend_provider: str, database_provider: str, github_url: str = None):
    prompt = f"Write a monumental Multi-Cloud Terraform (.tf) Architecture. The Frontend must be hosted dynamically on {frontend_provider}, and it must securely connect to a highly-available Database hosted strictly on {database_provider}."
    
    if github_url:
        rag_context = extract_github_codebase(github_url)
        if rag_context:
            prompt += f" Ensure you allocate resources tailored specifically to this scanned codebase dependency graph: {rag_context}"
    
    if not client:
        return f"# Error\n\nGoogle Gemini API Key is missing."
        
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT)
    )
    return response.text

def debug_deployment(error_msg: str, initial_guide: str):
    prompt = f"""The user encountered an error attempting to deploy their cloud architecture using your generated layout.
The prior deployment guide was:
{initial_guide[:2000]}

The user received this error:
"{error_msg}"

Please provide an Agentic debugging response giving exact bash/CLI commands to fix this issue."""
    
    if not client:
        return "Google Gemini API Key is missing. Debugging unavailable."
        
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(system_instruction="You are an elite Site Reliability Engineer. Keep patches short and copy-pasteable.")
    )
    return response.text
