"""
# define a function

functions = [
    {
        "name": "get_current_weather",
        "description": "Get the current weather in a given location",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "The city and state, e.g. San Francisco, CA"
                },
                "unit": {
                    "type": "string",
                    "enum": ["celsius", "fahrenheit"]
                }
            },
            "required": ["location"]
        }
    }
]

"""
import warnings
warnings.filterwarnings("ignore", category=UserWarning, module="pydantic._migration")

from langchain.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import DocArrayInMemorySearch
from langchain.schema.runnable import RunnableMap
from langchain.schema.output_parser import StrOutputParser
from app.core.config import settings



GOOGLE_API_KEY = settings.GOOGLE_API_KEY

#create a vector store
vector_store = DocArrayInMemorySearch.from_texts    (
    texts=["I like cats", "I like dogs", "I like birds"],
    embedding=GoogleGenerativeAIEmbeddings(
        model="models/embedding-001",
        task_type="retrieval_document",
        google_api_key=settings.GOOGLE_API_KEY
    )
)

#create a retriever
retriever = vector_store.as_retriever()

#get the top k results
# results = retriever.invoke("How do you feel about birds?")
#print(results)

templete = """
You are a helpful assistant that can answer questions based only on the following context:

{context}

Question: {question}
"""
# Create an output parser   
output_parser = StrOutputParser()

functions = [
    {
        "name": "weather_search",
        "description": "Get the current weather in a given an airport code",
        "parameters": {
            "type": "object",
            "properties": {
                "airport_code": {
                    "type": "string",
                    "description": "The airport code to get the weather for"
                },
            },
            "required": ["airport_code"]
        }
    }
]

# prompt = ChatPromptTemplate.from_template(templete)
prompt = ChatPromptTemplate.from_messages([
    ("human", "{input}")
])

# Set up Gemini for blog agent
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0,
    google_api_key=settings.GOOGLE_API_KEY,
    streaming=False
).bind_tools(functions)
"""
runnable = RunnableMap({
    "context": lambda x: retriever.invoke(x["question"]),
    "question": lambda x: x["question"]
})
""" 

chain = prompt | llm

result = chain.invoke({"input": "What is the weather in SFO?"})
print("\n", result)

# print(runnable.invoke({"question": "How do you feel about birds?"}))

"""
# Set up Gemini for blog agent
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0,
    google_api_key=settings.GOOGLE_API_KEY,
    convert_system_message_to_human=True,
    streaming=False
)

# Create a prompt template
prompt = ChatPromptTemplate.from_template(
    "Tell me a short joke about {topic}"
)

# Create an output parser   
output_parser = StrOutputParser()

# Create a chain
chain = prompt | llm | output_parser

# Run the chain
result = chain.invoke({"topic": "cats"})
print(result)
"""



