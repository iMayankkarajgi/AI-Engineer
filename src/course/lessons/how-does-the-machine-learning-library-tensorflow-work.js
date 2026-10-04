export default {
  id: 'how-does-the-machine-learning-library-tensorflow-work',
  minutes: 25,
  hook: 'The name says it all if you know how to read it: tensors flowing through a graph. But why would anyone describe a program as a graph instead of just running it line by line?',
  summary: 'TensorFlow is Google\'s open-source machine-learning library. It represents computations as dataflow graphs in which operations are nodes and tensors flow along the edges, which lets it optimise the computation, run it on CPUs, GPUs and TPUs, and export it to servers, phones and browsers. TensorFlow 2 runs eagerly like normal Python, records gradients with `tf.GradientTape`, turns Python functions into fast graphs with `tf.function`, and offers Keras as its high-level API.',
  sections: [
    {
      id: 'what-is-tensorflow',
      title: 'What is TensorFlow?',
      blocks: [
        { type: 'p', text: '**TensorFlow** is an open-source library for numerical computation and machine learning, created by the Google Brain team and released publicly in November 2015 under the Apache 2.0 licence. It grew out of an earlier internal Google system and became one of the most widely used deep-learning frameworks, alongside PyTorch (previous lesson).' },
        { type: 'p', text: 'Like PyTorch, it gives you three core capabilities: **tensors** (multi-dimensional arrays that can live on accelerators), **automatic differentiation** (gradients computed for you), and **building blocks** for models through its high-level API, **Keras**. What makes TensorFlow distinctive is its emphasis on **graphs** and on an end-to-end path from research to production: serving models on servers, running them on phones and microcontrollers, and even in web browsers.' },
        { type: 'p', text: 'We will keep our running house-price example: learn `price = w · size + b` from data, and see how TensorFlow expresses, executes, differentiates and deploys that computation.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a factory blueprint', text: 'Cooking at home, you follow a recipe step by step and taste as you go (eager execution). A food factory instead draws a complete blueprint of machines and conveyor belts first. Because the whole plan is known in advance, engineers can merge steps, run lines in parallel and copy the blueprint to another factory. A TensorFlow graph is that blueprint; tensors are the goods on the conveyor belts.' },
      ],
    },
    {
      id: 'tensors-and-flow',
      title: 'Tensors and the "flow": dataflow graphs',
      blocks: [
        { type: 'p', text: 'A **tensor** is a multi-dimensional array with a **shape** (e.g. `(32, 3)` for 32 houses × 3 features) and a **dtype** (e.g. `float32`). In TensorFlow, tensors are usually immutable values; the model\'s learnable parameters live in `tf.Variable` objects, which hold a tensor that can be updated in place.' },
        { type: 'p', text: 'A **dataflow graph** is a program drawn as a network. Each **node** is an operation ("op"), such as matrix multiply, add or ReLU. Each **edge** is a tensor flowing from the op that produces it to the ops that consume it. Hence the name: *tensors flow* through the graph.' },
        { type: 'flow', title: 'The dataflow graph for our house-price loss', nodes: [
          { label: 'Inputs X, Y', detail: 'Tensors of house sizes and true prices enter the graph.' },
          { label: 'MatMul(X, W)', detail: 'An op node. W is a tf.Variable holding the weight.' },
          { label: 'Add(·, b)', detail: 'Adds the bias variable b to get predictions.' },
          { label: 'MSE(pred, Y)', detail: 'Squares the differences and averages them: the loss tensor.' },
          { label: 'Gradient ops', detail: 'Autodiff adds backward ops that compute ∂loss/∂W and ∂loss/∂b, which an optimizer uses to update the variables.' },
        ] },
        { type: 'p', text: 'Why bother with a graph? Because once the whole computation is known as data, the system can **analyse and transform it** before running it:' },
        { type: 'list', items: [
          '**Optimise:** remove unused ops, fold constants, and fuse several small ops into one fast kernel (TensorFlow\'s XLA compiler does this kind of fusion).',
          '**Parallelise and place:** independent branches can run at the same time, and ops can be placed on different devices (CPU, GPU, TPU) or machines.',
          '**Export without Python:** a saved graph can be loaded by a C++ server, a mobile runtime or JavaScript, with no Python interpreter needed.',
        ] },
      ],
    },
    {
      id: 'define-then-run',
      title: 'Two styles: define-then-run and eager',
      blocks: [
        { type: 'p', text: '**TensorFlow 1.x** (2015–2019) used a strict **define-then-run** style. You first built the whole graph with symbolic placeholders (nothing was computed), then opened a `tf.Session` and called `session.run(...)` with a "feed dictionary" of real data. It was powerful for production but awkward to debug: printing a tensor showed a symbolic description, not numbers.' },
        { type: 'p', text: '**TensorFlow 2.0** (released September 2019) switched to **eager execution by default**: operations run immediately and return concrete values, just like NumPy or PyTorch. To keep the speed and portability of graphs, it added `tf.function`, which turns a Python function into a graph (more on that below). Keras became the official high-level API.' },
        { type: 'p', text: 'The code below builds a miniature define-then-run engine in plain Python to make the TF1 idea concrete: first we *describe* the computation as nodes, then a `run` function executes the graph in dependency order with fed-in data, many times. (TensorFlow is not installed in this course sandbox, so this miniature runs instead; real TensorFlow 2 code follows later.)' },
        { type: 'code', lang: 'python', title: 'mini_dataflow.py', code: `import numpy as np

# A miniature dataflow graph: nodes are operations, edges carry tensors.
class Node:
    def __init__(self, op, *inputs, name=""):
        self.op, self.inputs, self.name = op, inputs, name

def placeholder(name): return Node("placeholder", name=name)   # data fed at run time
def variable(name):    return Node("variable", name=name)      # trainable state
def matmul(a, b):      return Node("matmul", a, b)
def add(a, b):         return Node("add", a, b)
def mse(a, b):         return Node("mse", a, b)

def run(node, feed, cache=None):
    """Execute the graph: evaluate inputs first (dependency order), like a session."""
    cache = {} if cache is None else cache
    if node in cache: return cache[node]
    if node.op in ("placeholder", "variable"): val = feed[node.name]
    else:
        args = [run(i, feed, cache) for i in node.inputs]
        val = {"matmul": lambda a, b: a @ b, "add": lambda a, b: a + b,
               "mse": lambda a, b: np.mean((a - b) ** 2)}[node.op](*args)
    cache[node] = val
    return val

# 1) DEFINE the graph: nothing is computed yet
X, Y = placeholder("X"), placeholder("Y")
W, b = variable("W"), variable("b")
pred = add(matmul(X, W), b)
loss = mse(pred, Y)
print("graph defined; loss node op =", loss.op, "| inputs:", [n.op for n in loss.inputs])

# 2) RUN it many times with different data and updated variables
rng = np.random.default_rng(0)
xs = rng.uniform(0, 5, (64, 1)); ys = 2 * xs + 3
state = {"W": np.zeros((1, 1)), "b": np.zeros(1)}
for step in range(301):
    feed = {"X": xs, "Y": ys, **state}
    err = run(pred, feed) - ys                      # forward pass through the graph
    state["W"] -= 0.05 * 2 * xs.T @ err / len(xs)   # gradient step (hand-written here;
    state["b"] -= 0.05 * 2 * err.mean(0)            #  TensorFlow derives these for you)
    if step % 100 == 0:
        print(f"step {step:3d}  loss={run(loss, {'X': xs, 'Y': ys, **state}):.4f}")
print(f"learned W={state['W'].item():.3f}  b={state['b'].item():.3f}")`, output: `graph defined; loss node op = mse | inputs: ['add', 'placeholder']
step   0  loss=1.8645
step 100  loss=0.0091
step 200  loss=0.0001
step 300  loss=0.0000
learned W=2.000  b=2.999`, walkthrough: [
          { lines: [3, 12], note: 'A Node only records an op name and its input nodes. Placeholders stand for data fed at run time; variables stand for trainable state.' },
          { lines: [14, 24], note: 'run() is our "session": it evaluates a node by first evaluating its inputs (dependency order), caching results so shared sub-graphs run once.' },
          { lines: [26, 31], note: 'Defining the graph computes nothing. Printing the loss node shows its structure, not a number, just as in TensorFlow 1.' },
          { lines: [33, 41], note: 'Training runs the same graph repeatedly, feeding data and the current variable values. Here we write the gradient formulas ourselves; TensorFlow would add gradient ops to the graph automatically.' },
          { lines: [42, 44], note: 'The loss falls towards zero and the learned parameters approach the true w = 2, b = 3.' },
        ] },
        { type: 'compare', title: 'Graph (define-then-run) vs eager execution', options: [
          { name: 'Graph mode', summary: 'Describe the full computation first, then execute it (TF1 sessions; tf.function in TF2).', pros: ['Whole-program optimisation and op fusion', 'Easy export to non-Python runtimes', 'Efficient on TPUs and in production'], cons: ['Harder to debug', 'Python side effects behave surprisingly', 'Tracing rules to learn'], bestFor: 'Training at scale, deployment' },
          { name: 'Eager mode', summary: 'Each operation runs immediately and returns real values (TF2 default, PyTorch default).', pros: ['Feels like normal Python', 'Print and debug anywhere', 'Natural control flow'], cons: ['Per-op Python overhead', 'Fewer global optimisations'], bestFor: 'Research, prototyping, debugging' },
        ], rows: [
          ['When values exist', 'Only when the graph is run', 'Immediately'],
          ['How to get it in TF2', 'Decorate with @tf.function', 'Default'],
          ['Debugging with print()', 'Prints during tracing only', 'Works as expected'],
        ], verdict: 'TensorFlow 2 lets you develop eagerly and then wrap hot code in tf.function for graph speed.' },
      ],
    },
    {
      id: 'tf-function',
      title: 'tf.function: turning Python into a graph',
      blocks: [
        { type: 'p', text: 'When you decorate a Python function with `@tf.function`, the first call **traces** it: TensorFlow runs the Python code once with symbolic tensors, records every TensorFlow op into a graph (a "concrete function"), and then executes that graph. Later calls with inputs of the same shape and dtype reuse the graph and skip Python entirely. Python `if` and `for` statements that depend on tensor values are converted into graph control-flow ops by a tool called **AutoGraph**.' },
        { type: 'steps', title: 'What happens on calls to a @tf.function', items: [
          { title: 'First call', text: 'TensorFlow traces the Python function with placeholder tensors of the input\'s shape and dtype, building a graph.' },
          { title: 'Optimise', text: 'The graph is optimised (pruning, constant folding; optionally XLA compilation with jit_compile=True).' },
          { title: 'Execute', text: 'The graph runs on the chosen device and returns real tensors.' },
          { title: 'Later calls, same signature', text: 'The cached graph runs directly. Python code inside the function is not executed again.' },
          { title: 'New signature', text: 'A new input shape or dtype (or a new Python argument value) triggers a retrace and a new graph.' },
        ] },
        { type: 'callout', tone: 'warn', title: 'Common mistakes with tf.function', text: 'Expecting a Python `print()` inside a tf.function to run every call; it runs only during tracing (use `tf.print` instead). Passing changing Python numbers as arguments, which causes a retrace on every new value and makes things slower, not faster. Creating new `tf.Variable` objects inside the function on every call. And mutating Python lists or global state inside it, which happens only at trace time.' },
        { type: 'check', question: 'You decorate a training step with @tf.function and call it 1,000 times with batches of the same shape. How many times does the Python body actually run?', answer: 'Normally **once**, during the first-call trace. The remaining 999 calls execute the cached graph. That is why a Python `print()` inside appears only once.' },
      ],
    },
    {
      id: 'gradient-tape',
      title: 'Automatic differentiation with GradientTape',
      blocks: [
        { type: 'p', text: 'TensorFlow 2 computes gradients with `tf.GradientTape`. Inside a `with tf.GradientTape() as tape:` block, TensorFlow **records** the operations applied to watched values (trainable `tf.Variable`s are watched automatically) on a "tape". Calling `tape.gradient(loss, variables)` then plays the tape backwards, applying the chain rule, which is reverse-mode automatic differentiation, the same backpropagation we derived by hand.' },
        { type: 'p', text: 'The difference from PyTorch is mostly in style. PyTorch stores gradients in each parameter\'s `.grad` field after `loss.backward()`, and you zero them each step. TensorFlow returns gradients as a list from `tape.gradient(...)`, and you pass them to `optimizer.apply_gradients(...)`. A new tape is used each step, so there is nothing to zero. By default a tape can be used for only one gradient call (use `persistent=True` to compute several).' },
        { type: 'code', lang: 'python', title: 'train_tf.py (requires TensorFlow; shown without output)', code: `import tensorflow as tf

tf.random.set_seed(0)
X = tf.random.uniform((200, 1), 0, 5)               # house sizes
y = 2 * X + 3 + tf.random.normal((200, 1), 0, 0.5)  # prices with noise

w = tf.Variable(0.0)                                 # trainable state
b = tf.Variable(0.0)
opt = tf.keras.optimizers.SGD(learning_rate=0.02)

@tf.function                                         # trace once, then run as a graph
def train_step(xb, yb):
    with tf.GradientTape() as tape:                  # record ops on the tape
        pred = w * xb + b
        loss = tf.reduce_mean((pred - yb) ** 2)
    grads = tape.gradient(loss, [w, b])              # reverse-mode autodiff
    opt.apply_gradients(zip(grads, [w, b]))          # w -= lr * dL/dw, b -= lr * dL/db
    return loss

for epoch in range(100):
    for i in range(0, 200, 32):
        loss = train_step(X[i:i + 32], y[i:i + 32])
print(w.numpy(), b.numpy())                          # should approach 2 and 3`, walkthrough: [
          { lines: [3, 5], note: 'Data as TensorFlow tensors. Operations run eagerly here, outside any tf.function.' },
          { lines: [7, 9], note: 'Parameters are tf.Variables, which GradientTape watches automatically. The optimizer comes from Keras.' },
          { lines: [11, 18], note: 'One training step: record the forward pass on a tape, ask the tape for gradients, apply them. @tf.function compiles this into a graph on the first call.' },
          { lines: [20, 23], note: 'Mini-batch loop. Batches of 32 share a graph; the final batch of 8 has a different shape, so it triggers one extra trace.' },
        ] },
      ],
    },
    {
      id: 'keras',
      title: 'Keras: the high-level API',
      blocks: [
        { type: 'p', text: 'Most TensorFlow users never write a GradientTape loop. **Keras** wraps the whole pattern: you stack layers into a model, `compile` it with an optimizer and a loss, and call `fit` on your data. Under the hood, `fit` runs a `tf.function`-compiled training step with a GradientTape, exactly like the code above, and adds batching, shuffling, metrics, callbacks and validation.' },
        { type: 'code', lang: 'python', title: 'keras_house.py (requires TensorFlow; shown without output)', code: `import tensorflow as tf

model = tf.keras.Sequential([
    tf.keras.Input(shape=(1,)),
    tf.keras.layers.Dense(1),          # w·x + b
])
model.compile(optimizer="sgd", loss="mse")
model.fit(X, y, batch_size=32, epochs=100, verbose=0)   # X, y as before
model.save("house_price.keras")        # save architecture + weights`, walkthrough: [
          { lines: [3, 6], note: 'A one-neuron model: a Dense layer computes w·x + b, the same model we trained by hand.' },
          { lines: [7, 8], note: 'compile picks the optimizer and loss; fit runs the training loop for us.' },
          { lines: [9, 9], note: 'Save the trained model to a file for later loading or conversion.' },
        ] },
        { type: 'p', text: 'Keras started in 2015 as an independent library by François Chollet and later became TensorFlow\'s official high-level API. Since **Keras 3** (2023), Keras can also run on JAX or PyTorch backends, so the same Keras model code is no longer tied to TensorFlow alone.' },
      ],
    },
    {
      id: 'devices-and-deployment',
      title: 'Devices, scaling and deployment',
      blocks: [
        { type: 'p', text: 'TensorFlow places each op on a device automatically: on a GPU if one is visible, otherwise on the CPU, and you can override placement with `with tf.device(\'/GPU:0\'):`. It was designed with Google\'s **TPUs** (Tensor Processing Units, custom chips for matrix maths) in mind, and `tf.distribute` strategies split training across multiple GPUs, TPUs or machines.' },
        { type: 'p', text: 'Deployment is where TensorFlow\'s graph heritage pays off. A trained model is saved in the **SavedModel** format, which contains the graphs and the variable values. From there:' },
        { type: 'table', caption: 'Where a trained TensorFlow model can run', head: ['Target', 'Tool', 'What it does'], rows: [
          ['Servers', 'TensorFlow Serving', 'A high-performance server that loads SavedModels and answers prediction requests over HTTP or gRPC'],
          ['Phones, embedded, microcontrollers', 'TensorFlow Lite (renamed LiteRT in 2024)', 'Converts models to a compact format with optional quantization for on-device inference'],
          ['Web browsers and Node.js', 'TensorFlow.js', 'Runs models in JavaScript, using WebGL/WebGPU acceleration in the browser'],
          ['Production ML pipelines', 'TFX (TensorFlow Extended)', 'Components for data validation, training, evaluation and deployment pipelines'],
        ] },
        { type: 'viz', name: 'gpu-parallel', caption: 'Why accelerators matter: a GPU (or TPU) fills a large matrix with many cores in parallel, which is exactly the work that dominates a TensorFlow graph.' },
        { type: 'callout', tone: 'example', title: 'Real-world use', text: 'TensorFlow has been used widely inside Google and in industry for production systems such as recommendation, ranking, speech and vision, and TensorFlow Lite/LiteRT is a common way to put models on Android devices and microcontrollers. Many companies run TensorFlow models in production with TensorFlow Serving. In research and for open LLMs, PyTorch is now more common, and Google\'s own research increasingly uses JAX; TensorFlow remains strongest in established production and on-device pipelines.' },
      ],
    },
    {
      id: 'comparison-and-limits',
      title: 'TensorFlow vs PyTorch, and when not to use it',
      blocks: [
        { type: 'compare', title: 'TensorFlow vs PyTorch', options: [
          { name: 'TensorFlow', summary: 'Google\'s framework: eager by default, graphs via tf.function, Keras on top.', pros: ['Mature deployment story: Serving, LiteRT, TF.js', 'Strong TPU support', 'High-level Keras API for quick models'], cons: ['Two mental models (eager vs traced graph)', 'Less common in new research and open LLM code', 'Native Windows GPU support ended after version 2.10 (WSL2 is the recommended route)'], bestFor: 'Production pipelines, mobile/edge and browser deployment, teams already on TensorFlow' },
          { name: 'PyTorch', summary: 'Meta-originated framework: eager first, torch.compile for speed.', pros: ['Very Pythonic and easy to debug', 'Dominant in research and open LLMs', 'Huge ecosystem (e.g. Hugging Face)'], cons: ['Deployment often goes through export to another runtime', 'TPU support less central'], bestFor: 'Research, LLM training and fine-tuning, most new projects' },
        ], rows: [
          ['Default execution', 'Eager', 'Eager'],
          ['Graph capture', '@tf.function', 'torch.compile'],
          ['Gradients', 'tf.GradientTape → tape.gradient', 'loss.backward() → param.grad'],
          ['High-level API', 'Keras (model.fit)', 'nn.Module + your loop, or Lightning'],
        ], verdict: 'The core ideas, tensors, graphs and reverse-mode autodiff, are the same. Pick by ecosystem and deployment target.' },
        { type: 'list', items: [
          '**Do not reach for TensorFlow** for small tabular problems where scikit-learn or gradient-boosted trees are simpler and often better.',
          '**Think twice for new LLM work**, where most open models, tooling and tutorials assume PyTorch.',
          '**Do consider it** when you must deploy to Android, microcontrollers or browsers, or when your organisation already runs TFX and TensorFlow Serving.',
        ] },
        { type: 'check', question: 'Your team trains a model in TensorFlow and needs to run it on an Android phone with no Python available. What makes this possible?', answer: 'TensorFlow saves the model as a **graph plus weights** (SavedModel), which can be converted to the TensorFlow Lite / LiteRT format and executed by its lightweight on-device runtime. Because the computation is described as a graph rather than as Python code, no Python interpreter is needed.' },
      ],
    },
    {
      id: 'graph-optimisation-example',
      title: 'Going one level deeper',
      blocks: [
        { type: 'p', text: 'We said a graph can be "optimised" before it runs: unused ops removed, constants folded. Let us do both by hand on a tiny graph, so the words become concrete. Suppose a teammate wrote this function for our house prices:' },
        { type: 'list', items: [
          '`scale = 2 × 3` (two fixed numbers)',
          '`debug = x − 1` (computed, but never used again)',
          '`pred = x × scale + b`',
        ] },
        { type: 'p', text: 'Traced as written, the graph has four ops: `Mul(2, 3)`, `Sub(x, 1)`, `Mul(x, scale)` and `Add(·, b)`. With `x = [1, 2]` and `b = 3` it returns `[9, 15]`.' },
        { type: 'steps', title: 'Two optimisation passes over the graph', items: [
          { title: 'Start from the output', text: 'The only thing the caller wants is `pred`. Everything else exists to serve it.' },
          { title: 'Walk backwards and mark', text: '`pred` needs the `Add`. The `Add` needs `Mul(x, scale)` and `b`. That multiply needs `x` and `Mul(2, 3)`. We mark all of these as needed.' },
          { title: 'Prune', text: '`Sub(x, 1)` was never marked: nothing on the way to the output reads it. We delete it. Three ops remain.' },
          { title: 'Fold constants', text: '`Mul(2, 3)` has only constants as inputs, so its result can never change. We compute it once, now, and replace the op with the constant `6`. Two ops remain.' },
          { title: 'Check the result', text: 'The optimised graph is `Add(Mul(x, 6), b)`. With `x = [1, 2]`, `b = 3` it still returns `[9, 15]`. Same answer, half the work on every call.' },
        ] },
        { type: 'table', caption: 'The same function before and after optimisation', head: ['', 'As traced', 'After pruning and folding'], rows: [
          ['Ops run per call', '4', '2'],
          ['Ops', 'Mul(2, 3), Sub(x, 1), Mul(x, scale), Add', 'Mul(x, 6), Add'],
          ['Output for x = [1, 2], b = 3', '[9, 15]', '[9, 15]'],
          ['Ops run over 1,000,000 calls', '4,000,000', '2,000,000'],
        ] },
        { type: 'p', text: 'Why can eager execution not do this? Because it sees one line at a time. When it reaches `debug = x − 1` it must compute it straight away: it cannot know that nobody will read `debug` later. Only a system that holds the **whole** computation as data can look ahead from the output and decide what is needed. TensorFlow\'s built-in graph optimiser (named Grappler) runs passes like these on traced graphs automatically.' },
        { type: 'callout', tone: 'warn', title: 'Pruning can surprise you', text: 'The same rule removes things you wanted. A Python `print()` or a list `append` inside a traced function is not a graph op at all, so it never reaches the graph. If a result matters, return it or use a TensorFlow op such as `tf.print` for it.' },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: 'We build a miniature `@tf.function`. It traces a Python function once with a symbolic input, stores the recorded graph under the input shape, and afterwards runs the graph without touching the Python body. Then we call it four times and count how often the body really runs.' },
        { type: 'code', lang: 'python', title: 'practice_mini_tf_function.py', code: `import numpy as np

class Sym:                                   # a symbolic tensor: a name, no numbers
    def __init__(self, name, graph):
        self.name, self.graph = name, graph
    def _op(self, kind, other):
        out = Sym(f"t{len(self.graph)}", self.graph)
        other = other.name if isinstance(other, Sym) else other
        self.graph.append((out.name, kind, self.name, other))   # record the op
        return out
    def __mul__(self, other): return self._op("mul", other)
    def __add__(self, other): return self._op("add", other)

def function(py_fn):                         # a miniature @tf.function
    cache = {}
    def wrapper(x):
        key = x.shape                        # the input signature
        if key not in cache:                 # trace: run the Python body once
            graph = []
            out = py_fn(Sym("x", graph))
            cache[key] = (graph, out.name)
            print(f"  [traced for shape {key}: {len(graph)} ops recorded]")
        graph, out_name = cache[key]
        env = {"x": x}                       # execute the graph, no Python body
        for name, kind, a, b in graph:
            b = env[b] if isinstance(b, str) else b
            env[name] = env[a] * b if kind == "mul" else env[a] + b
        return env[out_name]
    return wrapper

@function
def predict(size):
    print("  python body is running")
    return size * 2.0 + 3.0                  # price = 2 * size + 3

for batch in ([1.0, 2.0], [3.0, 4.0], [1.0, 2.0, 3.0], [5.0, 6.0]):
    print("call ->", predict(np.array(batch)))`, output: `  python body is running
  [traced for shape (2,): 2 ops recorded]
call -> [5. 7.]
call -> [ 9. 11.]
  python body is running
  [traced for shape (3,): 2 ops recorded]
call -> [5. 7. 9.]
call -> [13. 15.]`, walkthrough: [
          { lines: [3, 12], note: 'A symbolic tensor holds no numbers. When we multiply or add it, it does not compute anything. It appends a line to the graph (result name, op, inputs) and returns a new symbol.' },
          { lines: [14, 29], note: 'The decorator. On a new input shape it calls the Python function once with a symbol, which fills the graph, and caches it. Then, on every call, it runs the cached graph with the real numbers in a small loop.' },
          { lines: [31, 34], note: 'An ordinary Python function. The `print` is plain Python, not a graph op.' },
          { lines: [36, 37], note: 'Four calls. The body runs for the first shape (2,) and again for the new shape (3,). The second and fourth calls reuse a cached graph, so "python body is running" does not appear.' },
        ] },
        { type: 'p', text: 'Now change it:' },
        { type: 'list', items: [
          'Add a global list `seen = []` and put `seen.append(1)` inside `predict`. After the loop, print `len(seen)`. Predict the number before running: 4, or something else?',
          'Change the signature to include the values: `key = (x.shape, tuple(x))`. Predict how many traces the four calls now cause. Which mistake from the lesson does this imitate?',
          'Add a fifth batch `[7.0, 8.0, 9.0]` to the loop. Predict whether it triggers a trace, and how many graphs the cache holds at the end.',
        ] },
        { type: 'check', question: 'The graphs traced for shape (2,) and shape (3,) contain exactly the same two ops. Why does our decorator, like tf.function, still trace a second time?', answer: 'Because it cannot know in advance that the body ignores the shape. The only safe rule is: a new signature means a new trace. A real graph is also specialised to its input shapes, which helps the optimiser. When we know many shapes will arrive, TensorFlow lets us declare a looser signature with an unknown dimension, so one graph serves them all. Without that, a stream of differently shaped inputs causes a retrace each time, which is slow.' },
        { type: 'check', question: 'Suppose we wrote `if size > 3:` inside predict. What would happen during tracing in our miniature, and how does real TensorFlow deal with it?', answer: 'During tracing `size` is a symbol with no value, so Python cannot decide which branch to take. Our miniature would simply fail, because `Sym` has no comparison. Real TensorFlow uses AutoGraph to rewrite such an `if` into a graph control-flow op, so **both** branches go into the graph and the choice is made at run time, when the tensor has real numbers.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does the "flow" in TensorFlow refer to?', options: ['The flow of training data from disk into memory during each epoch', 'Tensors flowing along the edges of a graph whose nodes are operations', 'The schedule by which the learning rate flows down during training', 'The order in which layers are added to a Keras model, input to output'], answer: 1, explain: 'TensorFlow represents computation as a graph: ops are nodes and tensors flow along the edges between them. The other options are real concepts but not the origin of the name.' },
    { q: 'A @tf.function-decorated function contains print("step"). You call it 50 times with inputs of the same shape and dtype. How many times is "step" printed?', options: ['Once, during tracing', '50 times, once per call', 'Never, as print is ignored', '51 times, including tracing'], answer: 0, explain: 'Python code inside a tf.function runs only while tracing; later calls run the cached graph. Use tf.print for output on every call.' },
    { q: 'Our @tf.function training step is slower than the eager version, and logs show it retracing on every call. We pass the learning rate as a different Python float each step. What should we change?', options: ['Remove GradientTape so the function has less to trace each call', 'Switch back to TensorFlow 1 sessions, which build the graph only once at the start', 'Pass it as a tensor or tf.Variable so the function signature stays the same', 'Add print statements inside the function to find which line retraces'], answer: 2, explain: 'Each new Python value creates a new signature and forces a retrace. Passing it as a tensor or storing it in a tf.Variable keeps one graph. Removing the tape would break training.' },
    { q: 'How does gradient computation in TensorFlow 2 compare with PyTorch?', options: ['TensorFlow uses numerical differences, while PyTorch uses true backpropagation', 'TensorFlow returns gradients from a GradientTape; PyTorch stores them in .grad', 'Only PyTorch has automatic differentiation; TensorFlow uses symbolic algebra', 'TensorFlow needs hand-written derivatives for each custom layer you add'], answer: 1, explain: 'Both use reverse-mode automatic differentiation. The difference is the interface: TensorFlow returns gradients from a tape, while PyTorch stores and accumulates them on the parameters, which is why PyTorch needs zero_grad.' },
    { q: 'Which statement is a misconception about TensorFlow?', options: ['TensorFlow 2 runs operations eagerly by default', 'Keras is TensorFlow\'s high-level API, and Keras 3 can also use other backends', 'A SavedModel can be served without Python, for example by TensorFlow Serving', 'TensorFlow 2 still requires a tf.Session to run any computation'], answer: 3, explain: 'Sessions belong to TensorFlow 1. TensorFlow 2 executes eagerly by default and uses tf.function when you want a graph. The other statements are correct.' },
  ],
  takeaways: [
    'TensorFlow represents computation as dataflow graphs: ops are nodes, tensors flow along edges.',
    'TensorFlow 1 used define-then-run sessions; TensorFlow 2 is eager by default and uses @tf.function to trace graphs.',
    'tf.GradientTape records operations and computes gradients by reverse-mode autodiff.',
    'Keras (compile + fit) wraps the training loop; SavedModel enables deployment to servers, phones and browsers.',
    'The ideas match PyTorch; TensorFlow\'s edge is deployment and TPUs, PyTorch\'s is research and LLM ecosystems.',
  ],
  terms: [
    { term: 'TensorFlow', def: 'Google\'s open-source machine-learning library built on tensors, dataflow graphs and automatic differentiation.' },
    { term: 'Dataflow graph', def: 'A representation of a program in which nodes are operations and edges carry tensors between them.' },
    { term: 'Eager execution', def: 'Running each operation immediately and returning concrete values, the default in TensorFlow 2.' },
    { term: 'tf.function', def: 'A decorator that traces a Python function into an optimised TensorFlow graph.' },
    { term: 'GradientTape', def: 'A TensorFlow context that records operations so gradients can be computed by reverse-mode autodiff.' },
    { term: 'Keras', def: 'A high-level neural-network API, TensorFlow\'s official interface for building and training models.' },
    { term: 'SavedModel', def: 'TensorFlow\'s format for storing a model\'s graphs and weights for serving or conversion.' },
  ],
};
