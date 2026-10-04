export default {
  id: 'how-does-pytorch-work',
  minutes: 25,
  hook: 'We just derived backpropagation by hand for a network with four parameters. How does a library do it automatically for a model with billions, on a GPU, while you write ordinary Python?',
  summary: 'PyTorch is a Python library for building and training neural networks. Its core is the tensor, a multi-dimensional array that can live on a GPU, plus autograd, which records every operation you run into a computation graph and then walks that graph backwards to compute gradients. A training loop is just: forward pass, loss, `loss.backward()`, `optimizer.step()`.',
  sections: [
    {
      id: 'what-is-pytorch',
      title: 'What is PyTorch?',
      blocks: [
        { type: 'p', text: '**PyTorch** is an open-source deep-learning library for Python. It was released in 2016 by Facebook\'s AI research lab (now Meta AI), building on an older Lua library called Torch, and it has been governed by the PyTorch Foundation under the Linux Foundation since 2022. It is one of the two best-known deep-learning frameworks (the other is TensorFlow, next lesson), and it is the framework used by most AI research code and most open-source LLM code today.' },
        { type: 'p', text: 'At its heart PyTorch provides three things:' },
        { type: 'list', items: [
          '**Tensors:** fast multi-dimensional arrays, like NumPy arrays, that can run on GPUs.',
          '**Autograd:** automatic computation of gradients for any calculation you write with tensors.',
          '**Building blocks:** ready-made layers (`torch.nn`), loss functions, optimizers (`torch.optim`), data loading utilities, and tools to save, compile and deploy models.',
        ] },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a calculator that remembers its work', text: 'An ordinary calculator gives you an answer and forgets how it got there. PyTorch is a calculator that writes every step on a receipt as you go. When you then ask "how would the answer change if I nudged this input?", it reads the receipt backwards and tells you, for every input at once. That receipt is the computation graph, and reading it backwards is backpropagation.' },
      ],
    },
    {
      id: 'tensors',
      title: 'What is a tensor?',
      blocks: [
        { type: 'p', text: 'A **tensor** is a grid of numbers with any number of dimensions. A single number is a 0-dimensional tensor (a scalar). A list of numbers is 1-D (a vector). A table is 2-D (a matrix). A colour image is usually 3-D (channels × height × width), and a batch of images is 4-D.' },
        { type: 'table', caption: 'Tensors you will meet constantly', head: ['Data', 'Typical shape', 'Meaning of each dimension'], rows: [
          ['A house\'s features', '(3,)', 'size, bedrooms, age'],
          ['A batch of 32 houses', '(32, 3)', 'batch, features'],
          ['A batch of RGB images', '(32, 3, 224, 224)', 'batch, channels, height, width'],
          ['A batch of token embeddings', '(8, 512, 768)', 'batch, sequence length, hidden size'],
          ['A linear layer\'s weights', '(256, 512)', 'output features, input features'],
        ] },
        { type: 'p', text: 'Every PyTorch tensor has three key properties: its **shape** (the size of each dimension), its **dtype** (number format, e.g. 32-bit float `float32`, 16-bit `bfloat16`, 64-bit integer `int64`), and its **device** (`cpu`, or a GPU such as `cuda:0`). Operations generally require their inputs to be on the same device, and shape mistakes are the single most common PyTorch error.' },
        { type: 'p', text: 'Tensors support the operations you would expect: element-wise arithmetic, matrix multiplication (`a @ b`), reductions (`sum`, `mean`), reshaping, indexing and **broadcasting**, the rule that lets a tensor of shape (32, 3) be added to one of shape (3,) by repeating the smaller one across the batch. If you know NumPy, you already know most of this.' },
      ],
    },
    {
      id: 'problem',
      title: 'The problem PyTorch solves',
      blocks: [
        { type: 'p', text: 'Look back at what training needed in the previous lessons. We had to (1) write the forward computation, (2) derive the gradient of the loss for every parameter by hand using the chain rule, (3) code those derivatives without bugs, and (4) make it all fast. Step 2 was manageable for four parameters. For a Transformer with dozens of different operations, it would be a nightmare, and every architecture change would mean re-deriving everything.' },
        { type: 'p', text: 'PyTorch removes steps 2 and 3 entirely: you write only the forward computation in normal Python, and it computes exact gradients for you. It also handles step 4 by running the heavy maths in optimised C++ and CUDA code on CPUs and GPUs. So researchers can try a new idea by changing a few lines of Python.' },
        { type: 'compare', title: 'NumPy by hand vs PyTorch', options: [
          { name: 'NumPy + hand-written gradients', summary: 'You write the forward pass and every derivative yourself.', pros: ['Total transparency', 'Great for learning (as in earlier lessons)'], cons: ['Derivatives must be re-derived for every model change', 'Bugs are easy and silent', 'No GPU support'], bestFor: 'Learning and tiny models' },
          { name: 'PyTorch', summary: 'You write the forward pass; autograd computes gradients; tensors can run on GPUs.', pros: ['Exact gradients for any model automatically', 'GPU acceleration', 'Huge library of layers, optimizers and pretrained models'], cons: ['A large dependency', 'Abstractions can hide bugs (shapes, devices, train/eval mode)'], bestFor: 'Essentially all real deep-learning work' },
        ], rows: [
          ['Who computes gradients?', 'You', 'Autograd'],
          ['Runs on GPU?', 'No', 'Yes'],
          ['Changing the architecture', 'Re-derive the maths', 'Edit the forward code'],
        ], verdict: 'Learn the maths once by hand; then let PyTorch do it.' },
      ],
    },
    {
      id: 'computation-graph',
      title: 'What is a computation graph?',
      blocks: [
        { type: 'p', text: 'A **computation graph** is a record of a calculation as a network of nodes: each node is an operation (add, multiply, matrix multiply, ReLU...) and each edge carries a tensor from one operation to the next. For `loss = (w·x + b − y)²` the graph is: multiply `w` and `x` → add `b` → subtract `y` → square.' },
        { type: 'p', text: 'PyTorch builds this graph **dynamically**, while your Python code runs. This style is called **define-by-run** or **eager execution**: each line executes immediately and returns real numbers you can print, and as a side effect PyTorch notes which operation produced each result. Because the graph is rebuilt on every forward pass, you can use ordinary Python `if` statements and loops, and the graph will simply follow whatever path your code took. You can stop in a debugger and inspect any tensor.' },
        { type: 'p', text: 'You can see the recording in practice: a tensor produced by an operation on tensors that require gradients has a `grad_fn` attribute pointing to the backward function of the operation that created it (for example `MulBackward0` or `AddBackward0`). Parameters you created yourself are **leaf** tensors with no `grad_fn`.' },
        { type: 'flow', title: 'The graph PyTorch records for loss = (w·x + b − y)²', nodes: [
          { label: 'Leaves w, b', detail: 'Parameters created with requires_grad=True. Autograd will store their gradients in .grad.' },
          { label: 'Multiply w·x', detail: 'Result records grad_fn = MulBackward: during backward it will send grad × x to w.' },
          { label: 'Add b, subtract y', detail: 'Each records its own backward rule. For addition the gradient passes through unchanged.' },
          { label: 'Square → loss', detail: 'A single number. Calling loss.backward() starts the backward walk here.' },
          { label: 'Backward walk', detail: 'Autograd visits the nodes in reverse order, applying the chain rule, and accumulates results into w.grad and b.grad.' },
        ] },
      ],
    },
    {
      id: 'autograd',
      title: 'What is autograd?',
      blocks: [
        { type: 'p', text: '**Autograd** is PyTorch\'s automatic differentiation engine. "Automatic differentiation" means computing exact derivatives of a program by applying the chain rule to each elementary operation, not by symbolic algebra and not by numerical nudging. PyTorch uses **reverse mode**, which is backpropagation in general form: one backward sweep gives the gradient of one output (the loss) with respect to every input.' },
        { type: 'steps', title: 'What happens when you call loss.backward()', items: [
          { title: 'Mark what to track', text: 'Parameters are tensors with `requires_grad=True` (every `nn.Module` parameter has this on by default).' },
          { title: 'Forward pass records', text: 'Every operation on tracked tensors creates a node that remembers its inputs and how to differentiate itself.' },
          { title: 'Seed the gradient', text: '`loss.backward()` starts from the loss with ∂L/∂L = 1.' },
          { title: 'Walk backwards', text: 'Nodes are visited in reverse order; each multiplies the incoming gradient by its local derivative and passes it to its inputs (the chain rule).' },
          { title: 'Accumulate into .grad', text: 'Gradients for leaf tensors are **added** into their `.grad` field. That is why you must zero them before the next step.' },
          { title: 'Free the graph', text: 'By default the graph is discarded after backward to save memory; the next forward pass builds a fresh one.' },
        ] },
        { type: 'p', text: 'To understand it fully, here is a working autograd engine in about 40 lines of plain Python. It supports only scalars with `+` and `*`, but its structure mirrors PyTorch: each result remembers its parents and a backward function, `backward()` sorts the graph and runs those functions in reverse. (PyTorch itself is not installed in this course sandbox, so we run this miniature instead; the real PyTorch version follows in the next section.)' },
        { type: 'code', lang: 'python', title: 'tiny_autograd.py', code: `# A tiny autograd engine: the core idea behind PyTorch's torch.Tensor + autograd
class Value:
    def __init__(self, data, parents=(), op=""):
        self.data, self.grad = data, 0.0
        self.parents, self.op = parents, op
        self.backward_fn = lambda: None      # how to push my grad to my parents

    def __add__(self, other):
        out = Value(self.data + other.data, (self, other), "+")
        def bw(): self.grad += out.grad; other.grad += out.grad
        out.backward_fn = bw
        return out

    def __mul__(self, other):
        out = Value(self.data * other.data, (self, other), "*")
        def bw(): self.grad += other.data * out.grad; other.grad += self.data * out.grad
        out.backward_fn = bw
        return out

    def backward(self):
        order, seen = [], set()
        def visit(v):                        # topological sort of the recorded graph
            if v not in seen:
                seen.add(v); [visit(p) for p in v.parents]; order.append(v)
        visit(self)
        self.grad = 1.0                      # dL/dL = 1
        for v in reversed(order):            # walk the graph backwards (chain rule)
            v.backward_fn()

# Forward pass builds the graph: L = (w*x + b - y)^2
w, b = Value(0.5), Value(0.0)
x, y = Value(2.0), Value(7.0)
for step in range(3):
    err = w * x + b + Value(-1.0) * y
    loss = err * err
    w.grad = b.grad = 0.0                    # like optimizer.zero_grad()
    loss.backward()                          # like loss.backward()
    print(f"step {step}: loss={loss.data:6.3f}  dL/dw={w.grad:+.2f}  dL/db={b.grad:+.2f}")
    w.data -= 0.05 * w.grad                  # like optimizer.step()
    b.data -= 0.05 * b.grad
print(f"graph ops recorded for the last loss: {loss.op}, {loss.parents[0].op}")`, output: `step 0: loss=36.000  dL/dw=-24.00  dL/db=-12.00
step 1: loss= 9.000  dL/dw=-12.00  dL/db=-6.00
step 2: loss= 2.250  dL/dw=-6.00  dL/db=-3.00
graph ops recorded for the last loss: *, +`, walkthrough: [
          { lines: [2, 6], note: 'Each Value stores its number, its gradient, the values it was made from, and a function that knows how to push gradients back to them.' },
          { lines: [8, 18], note: 'Every operation computes its result immediately (eager execution) and attaches a backward rule: addition passes the gradient through; multiplication scales it by the other input.' },
          { lines: [20, 28], note: 'backward(): topologically sort the recorded graph, seed dL/dL = 1, then call each node\'s backward rule from the loss back to the leaves.' },
          { lines: [31, 35], note: 'The forward pass for one house (x = 2, price 7) builds a fresh graph every step.' },
          { lines: [36, 37], note: 'Zero the old gradients, then run the backward pass. Note the += in the backward rules: gradients accumulate, exactly as in PyTorch.' },
          { lines: [38, 41], note: 'Gradient descent update. dL/dw = −24 matches the hand formula 2·(ŷ − y)·x = 2·(−6)·2.' },
        ] },
        { type: 'check', question: 'In the tiny engine, what would go wrong if we removed the line that sets w.grad and b.grad to 0 each step?', answer: 'Gradients would **accumulate** across steps (−24, then −24 + −12, ...), so each update would use the sum of all past gradients, giving far too large and wrong steps. PyTorch behaves the same way, which is why every training loop calls `optimizer.zero_grad()`.' },
      ],
    },
    {
      id: 'training-example',
      title: 'A complete training example',
      blocks: [
        { type: 'p', text: 'Here is the standard shape of a PyTorch training loop, fitting our house-price model `price = 2·size + 3` with mini-batch gradient descent. Every PyTorch training script you will read, from a toy regression to a large language model, follows this skeleton.' },
        { type: 'code', lang: 'python', title: 'train_pytorch.py (requires PyTorch; shown without output)', code: `import torch
from torch import nn

torch.manual_seed(0)
device = "cuda" if torch.cuda.is_available() else "cpu"

X = torch.rand(200, 1) * 5                       # 200 house sizes
y = 2 * X + 3 + 0.5 * torch.randn(200, 1)        # prices with noise
X, y = X.to(device), y.to(device)                # move data to the GPU if present

model = nn.Linear(1, 1).to(device)               # holds w and b, requires_grad=True
loss_fn = nn.MSELoss()
optimizer = torch.optim.SGD(model.parameters(), lr=0.02)

for epoch in range(100):
    for i in range(0, 200, 32):                  # mini-batches of 32
        xb, yb = X[i:i + 32], y[i:i + 32]
        pred = model(xb)                         # 1. forward pass (graph is recorded)
        loss = loss_fn(pred, yb)                 # 2. loss
        optimizer.zero_grad()                    # 3. clear old gradients
        loss.backward()                          # 4. autograd fills .grad
        optimizer.step()                         # 5. w -= lr * w.grad, b -= lr * b.grad

print(model.weight.item(), model.bias.item())    # should approach 2 and 3`, walkthrough: [
          { lines: [4, 9], note: 'Fix the random seed, pick the GPU if one exists, create data as tensors, and move it to that device.' },
          { lines: [11, 13], note: 'nn.Linear owns the parameters w and b. The loss function and the optimizer are separate objects; the optimizer is given the parameters it should update.' },
          { lines: [15, 22], note: 'The five-step loop: forward, loss, zero_grad, backward, step. This is the gradient descent loop from the earlier lessons, with autograd doing backpropagation.' },
          { lines: [24, 24], note: 'After training, the learned parameters should be close to the true slope 2 and intercept 3 (exact values depend on the random data).' },
        ] },
        { type: 'flow', title: 'The PyTorch training loop', loop: true, nodes: [
          { label: 'Batch', detail: 'Take the next mini-batch, usually from a DataLoader that shuffles and batches the dataset.' },
          { label: 'Forward', detail: 'pred = model(xb). PyTorch computes the result and records the graph.' },
          { label: 'Loss', detail: 'loss = loss_fn(pred, yb): one number.' },
          { label: 'zero_grad + backward', detail: 'Clear stale gradients, then loss.backward() runs autograd and fills every parameter\'s .grad.' },
          { label: 'Step', detail: 'optimizer.step() applies the update rule (SGD, Adam, AdamW...) using those gradients.' },
        ] },
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'Forgetting `optimizer.zero_grad()` (gradients accumulate). Forgetting `model.eval()` and `torch.no_grad()` at inference time (dropout and BatchNorm stay in training mode, and memory is wasted recording a graph you will never use). Tensors on different devices ("expected all tensors to be on the same device"). Shape mismatches that silently broadcast, for example predictions of shape (32, 1) compared with targets of shape (32,), which broadcasts to (32, 32). And calling `.item()` or printing GPU tensors every step, which forces slow synchronisation.' },
      ],
    },
    {
      id: 'gpu',
      title: 'What is the GPU and why does PyTorch use it?',
      blocks: [
        { type: 'p', text: 'A **CPU** (central processing unit) has a relatively small number of powerful cores designed to run varied, branching code quickly, one task after another. A **GPU** (graphics processing unit) has thousands of simpler cores designed to perform the same operation on huge amounts of data at once, originally to colour millions of pixels in parallel.' },
        { type: 'p', text: 'Neural networks are dominated by exactly that kind of work: large matrix multiplications where every output element can be computed independently. On a GPU these run many times faster than on a CPU. PyTorch makes this almost invisible: you move tensors and the model to the GPU with `.to("cuda")`, and the same Python code now calls NVIDIA\'s CUDA libraries (such as cuBLAS and cuDNN) underneath. PyTorch also supports other accelerators, such as Apple silicon GPUs through the `mps` device and AMD GPUs through ROCm builds.' },
        { type: 'viz', name: 'gpu-parallel', caption: 'A CPU with a few fast cores works through the matrix piece by piece, while a GPU with many simple cores fills it in parallel.' },
        { type: 'p', text: 'One subtlety: GPU operations run **asynchronously**. Python queues work on the GPU and continues immediately; it only waits when it needs a result back on the CPU (for example `loss.item()`). This is why benchmarks must synchronise before stopping a timer, and why frequent `.item()` calls slow training.' },
      ],
    },
    {
      id: 'popularity',
      title: 'Why is PyTorch so popular?',
      blocks: [
        { type: 'list', items: [
          '**It feels like Python.** Eager execution means you can print tensors, use loops and `if` statements, and debug with standard tools.',
          '**Flexible for research.** Because the graph is rebuilt every pass, unusual architectures are easy to express.',
          '**Ecosystem.** Libraries such as Hugging Face Transformers, PyTorch Lightning and many inference servers are built mainly around PyTorch, and most open-weight models are released with PyTorch code.',
          '**Performance when you need it.** PyTorch 2.x added `torch.compile`, which captures the graph and generates optimised kernels, giving some of the speed benefits of static graphs while keeping the eager programming style. Distributed training tools (such as DDP and FSDP) scale training across many GPUs.',
          '**Community.** A very large share of published research code uses PyTorch, so new ideas usually appear there first.',
        ] },
        { type: 'callout', tone: 'example', title: 'Real-world use', text: 'Training and fine-tuning open LLMs, computer-vision models for medical imaging and self-driving research, recommendation systems, and speech models are all commonly done in PyTorch. When you later fine-tune a model with LoRA or serve one with an inference engine, you will usually be working with PyTorch tensors underneath.' },
        { type: 'p', text: '**When not to use it:** for classic tabular problems, gradient-boosted trees (XGBoost, LightGBM) or scikit-learn are usually simpler and stronger. For tiny numeric scripts, NumPy suffices. And for some deployment targets (mobile, browsers, microcontrollers) you typically export a trained PyTorch model to another runtime rather than shipping PyTorch itself.' },
        { type: 'check', question: 'Why does PyTorch let you write a model whose number of layers depends on an `if` statement evaluated on each input?', answer: 'Because the computation graph is built **dynamically while the code runs** (define-by-run). Whatever path Python takes on this pass is exactly what gets recorded, so autograd differentiates that path.' },
      ],
    },
    {
      id: 'backward-walk-example',
      title: 'Worked example, step by step',
      blocks: [
        { type: 'p', text: 'Our tiny engine printed `dL/dw = −24` and `dL/db = −12` on its first step. Let us follow the backward walk node by node to see where those numbers come from. The values are `w = 0.5`, `x = 2`, `b = 0`, `y = 7`.' },
        { type: 'p', text: 'The forward pass creates five results, in this order: `p = w·x = 1`, `s = p + b = 1`, `n = (−1)·y = −7`, `err = s + n = −6`, and `loss = err·err = 36`. The backward pass visits them in the opposite order.' },
        { type: 'steps', title: 'The backward walk for step 0', items: [
          { title: 'Seed', text: '`loss.grad = 1`. Every other gradient starts at 0.' },
          { title: 'loss = err · err', text: 'A multiply sends "the other input × incoming gradient" to each input. Both inputs are the **same** node `err`, so it receives `−6 · 1` twice: `err.grad = −12`. This is the familiar `2·err`.' },
          { title: 'err = s + n', text: 'An add passes the gradient through unchanged: `s.grad = −12` and `n.grad = −12`.' },
          { title: 's = p + b', text: 'Again an add: `p.grad = −12` and `b.grad = −12`. The bias has its gradient.' },
          { title: 'p = w · x', text: 'A multiply: `w.grad = x · (−12) = −24` and `x.grad = w · (−12) = −6`. The weight has its gradient.' },
        ] },
        { type: 'table', caption: 'Every node after the backward walk', head: ['Node', 'Forward value', 'Gradient', 'Did we need it?'], rows: [
          ['loss', '36', '1', 'Starting point'],
          ['err', '−6', '−12', 'Yes, on the path to w and b'],
          ['s', '1', '−12', 'Yes'],
          ['p', '1', '−12', 'Yes'],
          ['w', '0.5', '−24', 'Yes: a parameter'],
          ['b', '0', '−12', 'Yes: a parameter'],
          ['x', '2', '−6', 'No: it is data'],
          ['n and y', '−7 and 7', '−12 and 12', 'No: they are data'],
        ] },
        { type: 'p', text: 'Two lessons hide in this walk. First, step 2 only works because the backward rules use `+=`. With a plain `=`, the second visit to `err` would overwrite the first and we would get `−6`, half the true gradient. Second, the order matters: `err` must have received **all** of its gradient before it passes anything on. That is why the engine sorts the graph first.' },
        { type: 'p', text: 'The last three rows show wasted work. Our engine computes gradients for the data `x` and `y`, which nobody uses. PyTorch avoids this: a tensor created without `requires_grad=True` is not tracked, and autograd skips every branch of the graph that leads only to untracked tensors. The same idea, switched on for a whole block of code, is `torch.no_grad()`.' },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: 'We saw that forgetting to zero gradients is a bug. But adding gradients up is a deliberate design, and here we use it on purpose. We rebuild the two objects of a PyTorch loop, a parameter with a `.grad` field and an optimizer with `zero_grad()` and `step()`, and show that four small backward passes can stand in for one large one. This trick is called **gradient accumulation**. It is used when a GPU has room for only a small batch but we want the smoother gradient of a large one: run several small backward passes, then step once.' },
        { type: 'code', lang: 'python', title: 'practice_grad_accumulation.py', code: `import numpy as np

class Param:                               # like a leaf tensor that requires grad
    def __init__(self, value):
        self.data, self.grad = float(value), 0.0

class SGD:                                 # like torch.optim.SGD
    def __init__(self, params, lr):
        self.params, self.lr = params, lr
    def zero_grad(self):
        for p in self.params:
            p.grad = 0.0
    def step(self):
        for p in self.params:
            p.data -= self.lr * p.grad

def forward_backward(w, b, x, y, scale=1.0):   # loss = scale * MSE of w*x + b
    err = w.data * x + b.data - y
    w.grad += scale * 2 * np.mean(err * x)     # += : accumulate, never overwrite
    b.grad += scale * 2 * np.mean(err)
    return scale * np.mean(err ** 2)

rng = np.random.default_rng(0)
x = rng.uniform(0, 5, 64)
y = 2 * x + 3
w, b = Param(0.5), Param(0.0)
opt = SGD([w, b], lr=0.05)

# A) one backward pass on all 64 examples
opt.zero_grad()
forward_backward(w, b, x, y)
print(f"one batch of 64    : dL/dw={w.grad:.4f}  dL/db={b.grad:.4f}")

# B) four backward passes on 16 examples each, with no zero_grad in between
opt.zero_grad()
for i in range(0, 64, 16):
    forward_backward(w, b, x[i:i + 16], y[i:i + 16], scale=1 / 4)
print(f"4 batches of 16    : dL/dw={w.grad:.4f}  dL/db={b.grad:.4f}")
opt.step()
print(f"after one step     : w={w.data:.4f}  b={b.data:.4f}")`, output: `one batch of 64    : dL/dw=-39.5945  dL/db=-13.4047
4 batches of 16    : dL/dw=-39.5945  dL/db=-13.4047
after one step     : w=2.4797  b=0.6702`, walkthrough: [
          { lines: [3, 5], note: 'A parameter is a number plus a slot for its gradient, like a PyTorch leaf tensor and its `.grad`.' },
          { lines: [7, 15], note: 'The optimizer only knows the list of parameters. `zero_grad` clears the slots; `step` applies `data −= lr · grad`. It never looks at the loss.' },
          { lines: [17, 21], note: 'This function plays the role of the forward pass plus `loss.backward()` for our one-neuron model. It **adds** into `.grad`, as autograd does. `scale` multiplies the loss.' },
          { lines: [29, 32], note: 'The reference: gradients from one pass over all 64 examples.' },
          { lines: [34, 40], note: 'Four passes over 16 examples each, each loss divided by 4, with no `zero_grad` in between. The accumulated gradients match the big batch to four decimals. Then a single `step` uses them.' },
        ] },
        { type: 'p', text: 'Now change it:' },
        { type: 'list', items: [
          'Remove `scale=1 / 4` from the call in part B. Before running, predict the new `dL/dw`. What ordinary setting would have the same effect on the update?',
          'Move `opt.step()` inside the `for` loop of part B, so the weights change after every small batch. Predict whether the printed gradients still match part A, and explain why.',
          'Use unequal batches: change the loop to `range(0, 64, 24)` with slices of 24 (the last one has only 16 examples) and `scale=1 / 3`. Predict whether the result still equals part A exactly.',
        ] },
        { type: 'check', question: 'Why do four accumulated passes over 16 examples give exactly the same gradient as one pass over 64 in this script?', answer: 'Two conditions hold. The loss is an average over examples, so the mean over 64 equals the average of the four means over 16, and dividing each small loss by 4 does that averaging. And the parameters do not change between the four passes, because we call `step` only once at the end. Break either condition (unequal batch sizes without proper weights, or a step in between) and the two no longer match.' },
        { type: 'check', question: 'A model contains BatchNorm layers. Would accumulating four batches of 16 behave exactly like one batch of 64?', answer: 'No. The gradients add up as before, but BatchNorm computes its mean and variance **inside each forward pass**, so it would normalize with statistics of 16 examples, not 64. Gradient accumulation imitates a large batch for the gradient only. Anything that depends on the batch during the forward pass still sees the small batch.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does PyTorch\'s autograd do?', options: ['It automatically searches for the best model architecture for the given data', 'It records tensor ops in a graph and walks it backwards to compute gradients', 'It translates the Python training code into C++ before running it', 'It approximates gradients by nudging each parameter slightly and re-running'], answer: 1, explain: 'Autograd is reverse-mode automatic differentiation: exact gradients from a recorded graph. It does not search architectures, and it does not use numerical finite differences, which would be slow and approximate.' },
    { q: 'In a training loop, which order of calls is correct for one step?', options: ['loss.backward() → model(x) → optimizer.step() → optimizer.zero_grad()', 'optimizer.zero_grad() → model(x) → compute loss → optimizer.step() → loss.backward()', 'model(x) → compute loss → optimizer.zero_grad() → loss.backward() → optimizer.step()', 'optimizer.zero_grad() → optimizer.step() → loss.backward()'], answer: 2, explain: 'Forward, loss, clear old gradients, compute new gradients, then update. Calling step before backward would update with stale or empty gradients.' },
    { q: 'Our model\'s training loss jumps around wildly and the gradients look far too large, growing every step. The loop has forward, loss, backward and step. What is most likely missing?', options: ['optimizer.zero_grad(); without it, gradients accumulate across steps', 'model.eval(), so dropout stops adding noise to each of the gradient updates', 'torch.manual_seed(), so the random initial weights stay consistent', 'A call to .to("cpu"), so the GPU stops overflowing the gradients'], answer: 0, explain: 'PyTorch adds new gradients into .grad, so without zeroing them every update uses the running sum of all previous gradients. model.eval() is for inference, and the seed only affects reproducibility.' },
    { q: 'How does PyTorch\'s eager (define-by-run) style differ from a static-graph style?', options: ['Eager mode cannot use GPUs, so it is mainly meant for small experiments', 'It runs ops immediately and rebuilds the graph each pass, so normal Python works', 'Eager mode needs hand-written gradients, since no graph is ever built in advance', 'Eager mode supports only simple models without loops or if statements'], answer: 1, explain: 'In eager mode each line returns real values and the graph follows whatever path the code took. It runs on GPUs and still computes gradients automatically. torch.compile can optionally capture a graph for extra speed.' },
    { q: 'Which statement about PyTorch is a misconception?', options: ['A tensor has a shape, a dtype and a device', 'GPU operations are queued asynchronously, so Python may continue before they finish', 'Moving the model to the GPU automatically moves your input data there too', 'Parameters of nn.Module layers have requires_grad=True by default'], answer: 2, explain: 'You must move inputs to the same device yourself (e.g. xb.to(device)); otherwise PyTorch raises a device-mismatch error. The other statements are correct.' },
  ],
  takeaways: [
    'PyTorch = GPU-capable tensors + automatic differentiation + ready-made layers, losses and optimizers.',
    'A tensor has a shape, a dtype and a device; most bugs are shape or device mismatches.',
    'Autograd records a computation graph while your code runs and walks it backwards on loss.backward().',
    'The training loop is: forward, loss, zero_grad, backward, step.',
    'GPUs speed up the matrix maths massively; PyTorch uses them through .to("cuda") with the same code.',
  ],
  terms: [
    { term: 'PyTorch', def: 'An open-source Python deep-learning library built around GPU tensors and automatic differentiation.' },
    { term: 'Tensor', def: 'A multi-dimensional array of numbers with a shape, a data type and a device.' },
    { term: 'Computation graph', def: 'A record of the operations that produced a result, used to compute gradients.' },
    { term: 'Autograd', def: 'PyTorch\'s reverse-mode automatic differentiation engine that fills each parameter\'s .grad.' },
    { term: 'Eager execution', def: 'Running each operation immediately as the Python code executes, building the graph on the fly.' },
    { term: 'Optimizer', def: 'An object such as SGD or Adam that updates parameters using their gradients.' },
    { term: 'GPU', def: 'A processor with thousands of simple cores that excels at parallel maths such as matrix multiplication.' },
  ],
};
