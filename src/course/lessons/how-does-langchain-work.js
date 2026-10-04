export default {
  id: "how-does-langchain-work",
  minutes: 27,
  hook: "Every LLM app needs the same plumbing (prompts, model calls, parsing, memory, retrieval, tools), so why write it from scratch every time?",
  summary: "LangChain is an open-source framework (Python and JavaScript) that gives standard building blocks for LLM apps: models, prompt templates, output parsers, retrievers, memory helpers and tools, all sharing one interface so they can be snapped together into chains with the `|` operator. Under the hood a chain is just function composition: each component's output becomes the next one's input. We will see real LangChain code and then rebuild the core idea in 30 lines of plain Python.",
  sections: [
    {
      id: "what-is-langchain",
      title: "What is LangChain?",
      blocks: [
        { type: "p", text: "**LangChain** is an open-source framework for building applications on top of large language models. It was started by Harrison Chase in late 2022 and is available for Python and JavaScript/TypeScript. It does not provide a model of its own. Instead it provides **standard components** for everything around the model, and integrations with hundreds of model providers, vector databases and tools." },
        { type: "p", text: "The project is split into packages. `langchain-core` holds the base interfaces (prompts, messages, runnables, parsers). Integration packages such as `langchain-openai` or `langchain-anthropic` connect specific providers. The `langchain` package adds higher-level pieces such as agents. Two sibling projects come from the same company: **LangGraph** for graph-based agents (next lesson) and **LangSmith** for tracing and evaluation. With LangChain 1.0 (released in late 2025) its agent API runs on top of LangGraph." },
        { type: "callout", tone: "analogy", title: "Think of LEGO bricks", text: "LEGO bricks come in many shapes, but every brick has the same studs, so any brick connects to any other. LangChain components are like that: a prompt, a model and a parser look different inside, but they all expose the same “studs” (an `invoke` method), so we can click them together in any order that makes sense." },
        { type: "p", text: "Running example: a **shop assistant** that answers product questions using our product docs and returns structured data our website can display." }
      ]
    },
    {
      id: "why-langchain",
      title: "Why do we need LangChain?",
      blocks: [
        { type: "p", text: "Calling one model once is easy with the provider's own SDK. Real apps quickly need more, and that “more” is the same in almost every app:" },
        { type: "list", items: [
          "**Prompt assembly:** filling variables into templates with system and user messages.",
          "**Provider differences:** OpenAI, Anthropic, Google and local models all have slightly different APIs and message formats.",
          "**Parsing:** turning free text into JSON or typed objects the rest of the code can use.",
          "**Memory:** carrying conversation history between calls.",
          "**Retrieval:** finding relevant documents and inserting them into the prompt (RAG).",
          "**Tools:** describing functions to the model and running the ones it asks for."
        ] },
        { type: "p", text: "Without a framework each team writes this glue again, slightly differently. LangChain's pitch is: use tested components with one common interface, swap a provider by changing one line, and get streaming, batching and tracing for free." }
      ]
    },
    {
      id: "core-idea",
      title: "The core idea: everything is a Runnable",
      blocks: [
        { type: "p", text: "The heart of modern LangChain is one interface called a **Runnable**. Anything that is a Runnable has the same methods: `invoke(input)` for one input, `batch([inputs])` for many, and `stream(input)` to get output piece by piece (plus async versions). Prompts, models, parsers and retrievers are all Runnables." },
        { type: "p", text: "Because they share an interface, two Runnables can be joined with the `|` (pipe) operator. `a | b` creates a new Runnable that runs `a` and passes its output to `b`. This syntax is called the **LangChain Expression Language (LCEL)**. In maths terms, a chain is function composition: `chain(x) = parser(model(prompt(x)))`." },
        { type: "formula", expr: "chain = prompt | model | parser   ⇔   chain(x) = parser(model(prompt(x)))", where: [["prompt", "dict of variables → list of chat messages"], ["model", "messages → AI message (text, maybe tool calls)"], ["parser", "AI message → string, dict or typed object"]], caption: "Each stage's output type must match the next stage's input type." }
      ]
    },
    {
      id: "llm-and-prompt-template",
      title: "LLM and prompt template",
      blocks: [
        { type: "p", text: "A **chat model** component wraps a provider's API. We create it once with settings (model name, temperature) and call `invoke` with messages. Because all chat models share the interface, swapping `ChatOpenAI` for `ChatAnthropic` is a one-line change." },
        { type: "p", text: "A **prompt template** is a reusable prompt with blanks. `ChatPromptTemplate.from_messages` takes a list of (role, text) pairs where the text may contain `{variables}`. Invoking the template with a dictionary fills the blanks and returns ready-to-send messages. Templates keep prompts out of string concatenation code and make them easy to version and test." },
        { type: "code", lang: "python", title: "real LangChain: prompt + model (needs langchain-openai and an API key)", code: `from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful shop assistant. Answer only from the context."),
    ("human", "Context: {context}\\n\\nQuestion: {question}"),
])
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

messages = prompt.invoke({"context": "The Steelbrew kettle holds 1.7 L.",
                          "question": "How much water does the kettle hold?"})
reply = llm.invoke(messages)   # an AIMessage
print(reply.content)`, walkthrough: [
          { lines: [1, 2], note: "Prompt tools come from `langchain-core`; the OpenAI model comes from its own integration package." },
          { lines: [4, 7], note: "A template with two variables. The system message sets the rules; the human message carries the data." },
          { lines: [8, 8], note: "The model component. Change this one line to use another provider." },
          { lines: [10, 13], note: "Fill the template, call the model, read the text. Each step uses `invoke`." }
        ] }
      ]
    },
    {
      id: "chains-and-output-parsers",
      title: "What is a chain? And output parsers",
      blocks: [
        { type: "p", text: "A **chain** is a sequence of components where each output feeds the next input. With LCEL we write `chain = prompt | llm | parser` and then call `chain.invoke(...)` once. Chains are themselves Runnables, so a chain can be a piece of a bigger chain." },
        { type: "p", text: "An **output parser** is the last link that turns the model's message into something our code can use. `StrOutputParser` returns plain text. `JsonOutputParser` extracts JSON. For typed results, many chat models support `llm.with_structured_output(MySchema)`, which uses the provider's structured-output or tool-calling features so the model returns data matching a Pydantic schema." },
        { type: "tabs", items: [
          { label: "Real LangChain", blocks: [
            { type: "code", lang: "python", title: "chain with structured output (not run here: library not installed)", code: `from pydantic import BaseModel
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

class ProductInfo(BaseModel):
    name: str
    in_stock: bool
    eta_days: int

prompt = ChatPromptTemplate.from_template(
    "Using this context: {context}\\nDescribe the product: {question}")
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
chain = prompt | llm.with_structured_output(ProductInfo)

info = chain.invoke({"context": "Kettle: in stock, ships in 2 days.", "question": "kettle"})
print(info.eta_days + 1)   # a real int, not text`, walkthrough: [
              { lines: [5, 8], note: "The schema we want back, as a Pydantic model." },
              { lines: [13, 13], note: "The chain: template, then a model wrapped to return `ProductInfo` objects." },
              { lines: [15, 16], note: "The result is a typed object, so arithmetic on `eta_days` just works." }
            ] }
          ] },
          { label: "Mini version (runnable)", blocks: [
            { type: "code", lang: "python", title: "minichain.py: the same idea in plain Python", code: `import json

class Runnable:
    """Anything with .invoke(); \`a | b\` builds a chain that feeds a's output to b."""
    def __init__(self, fn): self.fn = fn
    def invoke(self, x): return self.fn(x)
    def __or__(self, other):
        return Runnable(lambda x: other.invoke(self.invoke(x)))

def PromptTemplate(template):
    return Runnable(lambda vars: template.format(**vars))

def FakeLLM():  # stands in for a chat model API call
    def reply(prompt):
        product = prompt.split("Product: ")[1].strip()
        return f'Sure! {{"name": "{product}", "in_stock": true, "eta_days": 2}}'
    return Runnable(reply)

def JsonParser():  # pull the JSON object out of free text
    return Runnable(lambda text: json.loads(text[text.index("{"): text.rindex("}") + 1]))

docs = {"kettle": "The Steelbrew kettle boils 1.7 L.", "toaster": "The toaster has 4 slots."}
retriever = Runnable(lambda q: {"question": q, "context": docs.get(q.split()[-1], "")})

prompt = PromptTemplate("Answer in JSON.\\nContext: {context}\\nProduct: {question}")
chain = retriever | prompt | FakeLLM() | JsonParser()

print("prompt sent:", repr(prompt.invoke(retriever.invoke("kettle"))))
result = chain.invoke("kettle")
print("parsed:", result, "| type:", type(result).__name__)
print("eta + 1 =", result["eta_days"] + 1)`, output: `prompt sent: 'Answer in JSON.\\nContext: The Steelbrew kettle boils 1.7 L.\\nProduct: kettle'
parsed: {'name': 'kettle', 'in_stock': True, 'eta_days': 2} | type: dict
eta + 1 = 3`, walkthrough: [
              { lines: [3, 8], note: "The whole trick of LCEL: a class with `invoke`, and `__or__` so that `a | b` returns a new Runnable that runs a then b." },
              { lines: [10, 11], note: "A prompt template is just a Runnable that fills `{variables}` from a dict." },
              { lines: [13, 17], note: "A fake model that answers with chatty text wrapped around JSON, like real models often do." },
              { lines: [19, 20], note: "An output parser that cuts out the JSON and parses it into a Python dict." },
              { lines: [22, 23], note: "A toy retriever: finds the doc for the product and returns the variables the prompt needs." },
              { lines: [25, 26], note: "Four components piped into one chain, exactly the LCEL shape." },
              { lines: [28, 31], note: "Run it: we see the filled prompt, then a parsed dict we can do arithmetic on." }
            ] }
          ] }
        ] },
        { type: "check", question: "In the mini version, what would `(prompt | FakeLLM()).invoke({...})` return compared with the full chain?", answer: "A raw string like `Sure! {\"name\": ...}` instead of a dict, because the output parser link is missing. Each link changes the type: dict → prompt string → model text → parsed dict." }
      ]
    },
    {
      id: "memory",
      title: "Memory",
      blocks: [
        { type: "p", text: "Models are stateless: each call knows only what is in its prompt. **Memory** in LangChain means storing past messages and adding them to the next prompt. A prompt template can include a `MessagesPlaceholder` where the history goes. `RunnableWithMessageHistory` wraps a chain so that, for each session id, it loads the history before the call and saves the new messages after." },
        { type: "p", text: "Older LangChain versions had many `Memory` classes (such as `ConversationBufferMemory`); these are now legacy. For agents, current LangChain relies on LangGraph's **checkpointers**, which save the whole conversation state per thread. Whatever the API, the concept is the same: memory is the harness re-sending relevant history, often trimmed or summarised so it fits the context window." },
        { type: "callout", tone: "warn", title: "Memory is not free", text: "Every remembered message is re-sent and paid for on every call. Long chats need trimming (keep the last N messages) or summarisation, or costs and latency climb and early instructions get lost." }
      ]
    },
    {
      id: "retrieval-and-rag",
      title: "Retrieval and RAG",
      blocks: [
        { type: "p", text: "**Retrieval-augmented generation (RAG)** means finding relevant documents and putting them in the prompt so the model answers from our data. LangChain provides the pieces as components: **document loaders** (read PDFs, web pages), **text splitters** (cut documents into chunks), **embedding models** (turn text into vectors), **vector stores** (store and search vectors) and **retrievers** (anything that takes a query and returns documents)." },
        { type: "flow", title: "A RAG chain in LangChain", loop: false, nodes: [
          { label: "Load + split", detail: "Offline: a loader reads the product docs and a text splitter cuts them into chunks of a few hundred tokens with some overlap." },
          { label: "Embed + store", detail: "Offline: an embedding model turns each chunk into a vector, saved in a vector store such as an in-memory store, Chroma or pgvector." },
          { label: "Retriever", detail: "At question time: store.as_retriever() returns the top-k chunks most similar to the question." },
          { label: "Prompt", detail: "The chunks are joined into a context string and filled into the template with the question." },
          { label: "Model + parser", detail: "The model answers from the context; a parser returns text or structured data." }
        ] },
        { type: "code", lang: "python", title: "real LangChain RAG chain (not run here)", code: `from langchain_core.vectorstores import InMemoryVectorStore
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import OpenAIEmbeddings

store = InMemoryVectorStore.from_texts(
    ["The Steelbrew kettle holds 1.7 L.", "Returns are accepted within 30 days."],
    embedding=OpenAIEmbeddings())
retriever = store.as_retriever(search_kwargs={"k": 1})
format_docs = lambda docs: "\\n".join(d.page_content for d in docs)

rag_chain = ({"context": retriever | format_docs, "question": RunnablePassthrough()}
             | prompt | llm | StrOutputParser())     # prompt, llm from earlier
print(rag_chain.invoke("Can I return the kettle after two weeks?"))`, walkthrough: [
          { lines: [6, 9], note: "Embed two docs into an in-memory vector store and make a retriever that returns the single best match." },
          { lines: [10, 10], note: "Retrieved documents are objects; this helper joins their text." },
          { lines: [12, 13], note: "A dict of Runnables runs them on the same input: the question goes to the retriever (for context) and passes through unchanged (as question). Then prompt, model, parser." }
        ] }
      ]
    },
    {
      id: "tools-and-agents",
      title: "Tools and agents",
      blocks: [
        { type: "p", text: "A **tool** is a Python function the model may ask to call. In LangChain we decorate a function with `@tool`; its name, docstring and type hints become the description and argument schema sent to the model. When a model supports tool calling, `llm.bind_tools([...])` lets it reply with structured tool-call requests instead of text." },
        { type: "p", text: "An **agent** is a model in a loop that keeps calling tools until it can answer. In LangChain 1.0 the main entry point is `create_agent`, which builds this loop (on LangGraph under the hood): the model decides, the tool runs, the result goes back, repeat." },
        { type: "code", lang: "python", title: "real LangChain agent (not run here)", code: `from langchain.agents import create_agent
from langchain_core.tools import tool

@tool
def get_order_status(order_id: str) -> str:
    """Look up the shipping status of an order by its id."""
    return {"42": "shipped", "7": "packing"}.get(order_id, "unknown")

agent = create_agent(model="openai:gpt-4o-mini", tools=[get_order_status],
                     system_prompt="You are a polite shop support agent.")
result = agent.invoke({"messages": [{"role": "user", "content": "Where is order 42?"}]})
print(result["messages"][-1].content)`, walkthrough: [
          { lines: [4, 7], note: "The docstring matters: it is what the model reads to decide when to use the tool." },
          { lines: [9, 10], note: "Build an agent from a model id, a list of tools and a system prompt." },
          { lines: [11, 12], note: "Invoke with messages; the agent may call the tool, then answers. The last message is the reply." }
        ] }
      ]
    },
    {
      id: "follow-the-types",
      title: "Going one level deeper",
      blocks: [
        { type: "p", text: "Most chain bugs are type bugs: one link hands the next link something it did not expect. The mini version from this lesson is small enough to trace by hand, so let us follow one value through it." },
        { type: "table", caption: "The value at each link of `retriever | prompt | FakeLLM() | JsonParser()` for the input `\"kettle\"`", head: ["Link", "Receives", "Returns"], rows: [["retriever", "the string `kettle`", "a dict with `question` and `context`"], ["prompt", "that dict", "one filled-in prompt string"], ["FakeLLM", "the prompt string", "chatty text with JSON inside"], ["JsonParser", "the chatty text", "a Python dict"]] },
        { type: "p", text: "Now let us break it on purpose, in our heads." },
        { type: "table", caption: "Three ways to break the mini chain", head: ["Change", "What happens", "Why"], rows: [["Swap the last two links, so the parser comes before the model", "The parser fails: the prompt string has no `{` to find", "The parser was built for model text and received a prompt"], ["The retriever returns only the `question` key", "The template fails on the missing `context`", "The template has a blank that nothing filled"], ["Drop the parser", "No error at all. The caller gets a string and fails later, when it reads `eta_days`", "The chain ran fine; the type at its end is wrong"]] },
        { type: "steps", title: "Finding the broken link", items: [{ title: "Run the first link alone", text: "Invoke the retriever by itself and look at the value and its type." }, { title: "Add one link at a time", text: "A chain is itself a Runnable, so `(retriever | prompt)` can be invoked too. Print what comes out." }, { title: "Stop at the first surprise", text: "The first link whose output is not what the next link expects is the bug. Everything after it is only a symptom." }] },
        { type: "p", text: "The third row of the table is the dangerous one. A failure that raises an error is found at once. A wrong type that flows on quietly is found by a user." }
      ]
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will build memory the way this lesson describes it: a wrapper around a chain that loads the stored history for a session before the call and saves the new messages after it. The chain is plain function composition, and the model is a scripted stand-in." },
        { type: "code", lang: "python", title: "practice_session_memory.py", code: `# Memory as a wrapper: load history before the call, save new messages after.
def pipe(*steps):
    # Function composition: each step's output is the next step's input
    def chain(x):
        for step in steps:
            x = step(x)
        return x
    return chain

def prompt(variables):
    lines = ["system: You are a shop assistant."] + variables["history"]
    return lines + ["human: " + variables["question"]]

def fake_llm(messages):            # stands in for a chat model call
    seen = " ".join(messages).lower()
    product = "kettle" if "kettle" in seen else "unknown product"
    return f"ai: ({len(messages)} messages seen) You mean the {product}."

chain = pipe(prompt, fake_llm)
store = {}                         # session id -> list of past messages

def with_history(chain, keep_last=4):
    def invoke(question, session_id):
        history = store.setdefault(session_id, [])
        reply = chain({"history": history[-keep_last:], "question": question})
        history += ["human: " + question, reply]      # save after the call
        return reply
    return invoke

chat = with_history(chain)
print(chat("Do you sell a kettle?", "alice"))
print(chat("How much water does it hold?", "alice"))
print(chat("How much water does it hold?", "bob"))
print("stored:", {sid: len(msgs) for sid, msgs in store.items()})`, output: `ai: (2 messages seen) You mean the kettle.
ai: (4 messages seen) You mean the kettle.
ai: (2 messages seen) You mean the unknown product.
stored: {'alice': 4, 'bob': 2}`, walkthrough: [{ lines: [2, 8], note: "`pipe` composes functions: the output of each step is the input of the next. It plays the role of `|`." }, { lines: [10, 17], note: "A prompt step that puts the history between the system line and the new question, and a fake model that reports how many messages it saw." }, { lines: [22, 28], note: "The memory wrapper: look up the session's history, pass the last few messages into the chain, then save the question and the reply." }, { lines: [30, 34], note: "Two sessions. Alice asks a follow-up that only makes sense with history; Bob asks the same question with none." }] },
        { type: "p", text: "Now change it:" },
        { type: "list", items: ["Set `keep_last=1`. Predict how many messages the model sees on Alice's second question, and whether it still names the product.", "Add two more questions from Alice. Predict the “messages seen” number for each. Where does it stop growing, and why?", "Give Bob the session id `\"alice\"`. Predict his reply. Why would this be a serious bug in a real shop?"] },
        { type: "check", question: "Bob asked the same question as Alice and got “unknown product”. The model function is the same for both. What is different?", answer: "The input. Memory is stored per session id, and Bob's session has no earlier messages, so his prompt held only the system line and his question. The model has no state of its own. It seemed to remember the kettle for Alice only because the wrapper sent her earlier messages again. Change what the wrapper sends, and we change what the model appears to know." },
        { type: "check", question: "`with_history` saves the new messages *after* the chain returns. Suppose the chain raises an error halfway. What ends up in the store, and is that the behaviour we want?", answer: "Nothing new is saved, because the line that extends the history is never reached. That is usually what we want: a question with no answer would leave the history unbalanced and could confuse the next call. The price is that the failed question is forgotten, so the app should show the error and let the user ask again." }
      ]
    },
    {
      id: "complete-flow",
      title: "A complete flow, and how LangChain compares",
      blocks: [
        { type: "steps", title: "What happens when our shop assistant answers one question", items: [
          { title: "Input", text: "The user asks “Is the kettle in stock and when would it arrive?”. The chain receives the question (and a session id if memory is used)." },
          { title: "Retrieve", text: "The retriever embeds the question and fetches the top product-doc chunks." },
          { title: "Fill the prompt", text: "The template combines system rules, history, context and the question into messages." },
          { title: "Call the model", text: "The chat model component sends the messages to the provider and gets an AI message back (possibly with tool calls if tools are bound)." },
          { title: "Parse", text: "The output parser or structured-output wrapper turns the reply into a typed object." },
          { title: "Return and trace", text: "The website gets the object; if LangSmith tracing is enabled, every step's inputs, outputs and timing are recorded." }
        ] },
        { type: "compare", title: "Ways to build the same app", options: [
          { name: "Provider SDK only", summary: "Call the OpenAI or Anthropic SDK directly and write the glue yourself.", pros: ["Fewest dependencies", "Full control, nothing hidden"], cons: ["Re-implement parsing, retrieval, tools", "Switching provider means rewriting"], bestFor: "Small apps with one provider" },
          { name: "LangChain", summary: "Standard components joined into chains; many integrations.", pros: ["Fast to assemble", "Swap providers and stores easily", "Streaming, batching, tracing built in"], cons: ["Extra abstraction layers to learn and debug", "API has changed a lot over versions"], bestFor: "RAG apps and straightforward chains or agents" },
          { name: "LangGraph", summary: "Explicit graphs of nodes, edges and state for agents.", pros: ["Fine control of loops and branches", "Persistence and human-in-the-loop"], cons: ["More design work upfront"], bestFor: "Complex, long-running or multi-step agents" }
        ], verdict: "Use LangChain components for the building blocks; move to LangGraph when the control flow itself becomes the hard part." },
        { type: "callout", tone: "warn", title: "Common pitfalls", text: "Copying old tutorials: many use classes that were deprecated (old chain and memory classes). Check the version you install. Hiding prompts: always print or trace the final prompt the model saw; most bugs are visible there. Over-abstracting: for a single model call, a framework may add more complexity than it removes." }
      ]
    }
  ],
  quiz: [
    { q: "What does the `|` operator do between two LangChain Runnables?", options: ["Runs both at the same time on the input and merges their results", "Makes a Runnable that feeds the first one's output to the second", "Runs both and returns whichever one finishes first", "Compares the two outputs and keeps the better one"], answer: 1, explain: "LCEL's pipe is function composition: `a | b` runs a, then feeds its output to b." },
    { q: "Our chain returns a long chatty string, but the website needs a dict with `in_stock` and `eta_days`. What should we add?", options: ["A retriever at the start that fetches the product documents", "A bigger model that writes cleaner and shorter answers", "Memory that keeps the last ten messages of the conversation", "An output parser or structured output at the end"], answer: 3, explain: "Output parsers and structured output turn model text into typed data. Retrieval and memory change the input, not the output format." },
    { q: "In the mini version, `chain = retriever | prompt | FakeLLM() | JsonParser()`. What is the type of the value passed from `prompt` to `FakeLLM()`?", options: ["A dict of variables", "A parsed dict", "A filled-in prompt string", "A list of documents"], answer: 2, explain: "The retriever outputs a dict; the prompt template turns it into a string; the model returns text; the parser returns a dict." },
    { q: "When is LangGraph usually a better fit than a plain LangChain chain?", options: ["When the flow has loops, branches, persistence or approvals", "When we only need a single model call with a fixed prompt", "When we want the fewest possible dependencies in our project", "When the application does not use any tools or retrieval"], answer: 0, explain: "Chains are great for linear pipelines. Complex control flow is LangGraph's job." },
    { q: "Which statement about LangChain is a misconception?", options: ["It integrates many model providers behind one common interface", "It is itself an LLM you can call without any model provider", "Prompts, models and parsers all share the Runnable interface", "Memory works by re-sending stored history in the prompt"], answer: 1, explain: "LangChain has no model of its own; it wraps providers' models (or local models)." }
  ],
  takeaways: [
    "LangChain provides standard components around LLMs: models, prompts, parsers, retrievers, memory helpers and tools.",
    "Everything is a Runnable with invoke, batch and stream, so components snap together with `|`.",
    "A chain is function composition: each link's output type must match the next link's input.",
    "Output parsers and structured output turn model text into data your code can trust.",
    "RAG, memory and agents are just more components in the pipeline; agents now run on LangGraph.",
    "For complex control flow use LangGraph; for one call, the provider SDK may be enough."
  ],
  terms: [
    { term: "LangChain", def: "An open-source framework of standard, composable components for building LLM applications." },
    { term: "Runnable", def: "LangChain's common interface with invoke, batch and stream; prompts, models, parsers and chains are all Runnables." },
    { term: "LCEL", def: "LangChain Expression Language: composing Runnables with the `|` operator." },
    { term: "Prompt template", def: "A reusable prompt with named blanks that are filled from a dictionary at run time." },
    { term: "Output parser", def: "A component that turns a model's reply into a string, JSON or typed object." },
    { term: "Retriever", def: "A component that takes a query and returns relevant documents, often from a vector store." }
  ]
};
