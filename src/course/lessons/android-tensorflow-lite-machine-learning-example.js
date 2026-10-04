export default {
  id: 'android-tensorflow-lite-machine-learning-example',
  minutes: 20,
  hook: 'How does a model trained in Python end up recognising a hand-drawn digit inside an Android app, with no internet at all?',
  summary: 'TensorFlow Lite (now also called LiteRT) is a runtime for running trained models on phones and small devices. We train a model in Python, convert it to a compact .tflite file (usually quantised to 8-bit integers), bundle it in the app\'s assets, load it with an Interpreter in Kotlin, and call run() on preprocessed input. We also simulate int8 inference in numpy to see why the quantised model is 4× smaller yet gives almost the same answers.',
  sections: [
    {
      id: 'why-tflite',
      title: 'Why TensorFlow Lite exists',
      blocks: [
        { type: 'p', text: 'In the previous lesson we saw why we might run a model **on the device**: low latency, privacy, offline use and no server bill. But a model trained with full TensorFlow on a laptop is not ready for a phone. The training library is large, the model file stores 32-bit floats, and the code expects a desktop CPU or a big GPU. We need a small, fast engine that only does one thing: run an already-trained model.' },
        { type: 'p', text: '**TensorFlow Lite** (TFLite) is that engine. It has two halves: a **converter**, which runs on our computer and turns a trained model into a compact `.tflite` file (a FlatBuffer, a binary format that can be read without unpacking), and an **interpreter**, a small runtime library inside the app that loads that file and executes it on the phone\'s CPU, GPU or other accelerators. In 2024 Google renamed TFLite to **LiteRT** ("Lite Runtime"); the file format and the core ideas are the same, and older `org.tensorflow:tensorflow-lite` packages remain widely used, so we will see both names.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a printed recipe card', text: 'Training is the test kitchen with every pot and ingredient, where a chef experiments for weeks. The `.tflite` file is the final recipe card: only the steps needed to cook the dish, with measurements rounded to what a home cook can use. The interpreter is the home cook who follows the card quickly in a small kitchen (the phone).' },
        { type: 'p', text: 'Our running example: a **handwritten digit recogniser**. The user draws a digit 0–9 on the screen, and the app instantly says which digit it is. The model is trained on MNIST, a classic dataset of 70,000 grayscale 28 × 28 pixel images of handwritten digits.' },
      ],
    },
    {
      id: 'workflow',
      title: 'The end-to-end workflow',
      blocks: [
        { type: 'flow', title: 'From Python training to Android inference', nodes: [
          { label: 'Train (Python)', detail: 'Build and train a Keras model on MNIST on a laptop or in a notebook. Output: a float32 TensorFlow model.' },
          { label: 'Convert', detail: 'TFLiteConverter turns it into a .tflite FlatBuffer and can quantise weights to int8, shrinking the file about 4×.' },
          { label: 'Bundle', detail: 'Copy digits.tflite into app/src/main/assets so it ships inside the APK, or download it at runtime.' },
          { label: 'Load', detail: 'In Kotlin, memory-map the file and create an Interpreter once, when the screen opens.' },
          { label: 'Preprocess', detail: 'Turn the user\'s drawing (a Bitmap) into exactly the tensor shape and value range the model was trained on: 28 × 28 floats in [0, 1].' },
          { label: 'Run', detail: 'interpreter.run(input, output) fills an array of 10 scores, one per digit.' },
          { label: 'Postprocess', detail: 'Pick the highest score, show the digit and its confidence on screen.' },
        ] },
        { type: 'p', text: 'Two words appear in every step. A **tensor** is just a multi-dimensional array of numbers: a 28 × 28 image is a 2-D tensor, a batch of one image with one colour channel is a 4-D tensor of shape `[1, 28, 28, 1]`. The **input and output signature** is the agreed shape and type of these tensors. Most bugs in on-device ML come from the app feeding a tensor that does not match what the model was trained on.' },
      ],
    },
    {
      id: 'convert-and-quantize',
      title: 'Converting and quantising the model',
      blocks: [
        { type: 'p', text: 'After training, conversion takes a few lines of Python. Setting `optimizations` turns on quantisation. Giving a **representative dataset** (a few hundred real inputs) lets the converter measure the range of every intermediate value, so it can quantise activations too, not just weights. This is called **post-training quantisation** because it happens after training, with no retraining.' },
        { type: 'code', lang: 'python', title: 'convert.py (needs TensorFlow; shown for reference)', code: `import tensorflow as tf

# model = a trained tf.keras model; x_train = MNIST images scaled to [0, 1]
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]     # enable quantisation

def representative_dataset():
    for img in x_train[:200]:                          # ~100-500 samples is typical
        yield [img[None, ..., None].astype("float32")]  # shape [1, 28, 28, 1]

converter.representative_dataset = representative_dataset
tflite_bytes = converter.convert()
with open("digits.tflite", "wb") as f:
    f.write(tflite_bytes)`,
          walkthrough: [
            { lines: [1, 5], note: 'Create a converter from the trained Keras model and ask for the default optimisation, which quantises weights to 8 bits.' },
            { lines: [7, 11], note: 'A generator of real sample inputs. The converter runs them through the model to record the min and max of each activation, which fixes their quantisation scale.' },
            { lines: [12, 14], note: 'convert() returns the FlatBuffer bytes; we save them as digits.tflite. With this setup the input and output tensors stay float32, which keeps the Android code simple.' },
          ] },
        { type: 'p', text: 'Quantisation maps each real number to an 8-bit integer using a **scale** (how much one integer step is worth) and a **zero point** (which integer stands for 0.0). TFLite\'s int8 scheme uses symmetric quantisation for weights (zero point 0, often one scale per output channel) and asymmetric quantisation for activations (a zero point lets the range be shifted, for example to cover [0, 6] after a ReLU).' },
        { type: 'formula', expr: 'real ≈ scale × (q − zero_point),   q = clamp(round(real / scale) + zero_point, −128, 127)', where: [ ['q', 'the stored 8-bit integer'], ['scale', 'a float, e.g. max|w| / 127 for symmetric weights'], ['zero_point', 'the integer that represents 0.0 (0 for symmetric weights)'] ], caption: 'Example: with scale 0.00921, the weight 0.0377 becomes round(0.0377 / 0.00921) = 4, and decodes to 4 × 0.00921 = 0.0368. The small difference is the quantisation error.' },
        { type: 'viz', name: 'quantization', caption: 'Lower the bit width and watch weights snap to fewer allowed values. At 8 bits the error is tiny; at 2 to 3 bits it becomes visible.' },
      ],
    },
    {
      id: 'android-setup',
      title: 'Setting up the Android project',
      blocks: [
        { type: 'steps', title: 'Project setup, step by step', items: [
          { title: 'Add the runtime dependency', text: 'In the app module\'s build.gradle.kts add the TFLite library, for example `implementation("org.tensorflow:tensorflow-lite:<version>")`. Newer projects can use the LiteRT artifact instead; check the current docs for the exact coordinates and version.' },
          { title: 'Put the model in assets', text: 'Copy digits.tflite into `app/src/main/assets/`. Everything in assets is packaged inside the APK and readable at runtime.' },
          { title: 'Stop the build from compressing it', text: 'Add `androidResources { noCompress += "tflite" }` (older Gradle: `aaptOptions { noCompress "tflite" }`). The interpreter memory-maps the file, and a compressed asset cannot be memory-mapped.' },
          { title: 'Create the Interpreter once', text: 'Loading a model takes time and memory, so create the Interpreter when the screen or app starts and reuse it for every prediction, then close() it when done.' },
          { title: 'Run inference off the main thread', text: 'Even a fast model can take tens of milliseconds. Run it in a background coroutine so the UI never freezes.' },
        ] },
        { type: 'p', text: '**Memory-mapping** means the operating system makes the file appear as if it were in memory without copying it all into the app\'s heap; pages are read from storage when touched. This makes loading fast and keeps memory use low, which is why `noCompress` matters.' },
      ],
    },
    {
      id: 'kotlin-code',
      title: 'The Kotlin integration code',
      blocks: [
        { type: 'p', text: 'Here is a complete classifier class. It loads the model, converts a Bitmap into the float tensor the model expects, runs inference, and returns the best digit with its probability. It runs on a device, so there is no console output to show here; the next section simulates the same math in Python.' },
        { type: 'code', lang: 'kotlin', title: 'DigitClassifier.kt', code: `import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import org.tensorflow.lite.Interpreter
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel

class DigitClassifier(context: Context) {
    private val interpreter: Interpreter

    init {
        val options = Interpreter.Options().apply { setNumThreads(4) }
        interpreter = Interpreter(loadModel(context, "digits.tflite"), options)
    }

    private fun loadModel(context: Context, name: String): MappedByteBuffer {
        val fd = context.assets.openFd(name)
        FileInputStream(fd.fileDescriptor).use { stream ->
            return stream.channel.map(
                FileChannel.MapMode.READ_ONLY, fd.startOffset, fd.declaredLength)
        }
    }

    fun classify(drawing: Bitmap): Pair<Int, Float> {
        val img = Bitmap.createScaledBitmap(drawing, 28, 28, true)
        val input = ByteBuffer.allocateDirect(4 * 28 * 28).order(ByteOrder.nativeOrder())
        for (y in 0 until 28) for (x in 0 until 28) {
            val p = img.getPixel(x, y)
            val gray = (Color.red(p) + Color.green(p) + Color.blue(p)) / 3f
            input.putFloat(gray / 255f)          // same [0, 1] scaling as training
        }
        val output = Array(1) { FloatArray(10) } // shape [1, 10]
        interpreter.run(input, output)
        val probs = output[0]
        val best = probs.indices.maxByOrNull { probs[it] } ?: 0
        return best to probs[best]
    }

    fun close() = interpreter.close()
}`,
          walkthrough: [
            { lines: [1, 9], note: 'Imports: Android graphics for the drawing, the TFLite Interpreter, and Java NIO classes for direct byte buffers and memory-mapped files.' },
            { lines: [14, 17], note: 'Create the Interpreter once, with 4 CPU threads. Options is also where hardware accelerators (delegates) would be added.' },
            { lines: [19, 25], note: 'Memory-map the uncompressed asset: openFd gives the file\'s offset and length inside the APK, and map() exposes those bytes without copying them.' },
            { lines: [27, 34], note: 'Preprocess: scale the drawing to 28 × 28, convert each pixel to grayscale, and divide by 255 so values are in [0, 1], exactly as during training. A direct ByteBuffer in native byte order is what the interpreter reads fastest.' },
            { lines: [35, 39], note: 'Allocate an output array matching the model\'s [1, 10] output, run inference, and pick the index with the highest probability.' },
            { lines: [42, 42], note: 'Release native memory when the screen is destroyed.' },
          ] },
        { type: 'callout', tone: 'warn', title: 'The most common bug: preprocessing mismatch', text: 'MNIST digits are **white strokes on a black background**. If our drawing canvas is black ink on white paper, we must invert the pixels (`1f - gray / 255f`) or the model sees a completely different kind of image and answers nonsense with high confidence. The same goes for channel order, value range ([0, 1] vs [−1, 1]) and image orientation.' },
        { type: 'p', text: 'From an Activity or ViewModel we would call it inside a background coroutine, for example `val (digit, conf) = withContext(Dispatchers.Default) { classifier.classify(bitmap) }`, then update a TextView on the main thread with the result.' },
      ],
    },
    {
      id: 'simulate-int8',
      title: 'Simulating int8 inference in numpy',
      blocks: [
        { type: 'p', text: 'What actually happens inside the interpreter for a quantised layer? The phone multiplies **8-bit integers**, adds the products into **32-bit integer** accumulators (so they do not overflow), and converts back to real units once at the end. Integer math is cheaper in energy and is what many mobile accelerators are built for. Let us simulate one dense layer of a tiny digit-like classifier (64 inputs, 10 classes) and compare it with float32.' },
        { type: 'code', lang: 'python', title: 'int8_inference_sim.py', code: `# Simulate what TFLite does on a phone: run a float model and its int8 version.
import numpy as np
rng = np.random.default_rng(0)

# A tiny "trained" classifier: 64 input features -> 10 classes (like 8x8 digits)
W = rng.normal(0, 0.3, (64, 10)).astype(np.float32)
b = rng.normal(0, 0.1, 10).astype(np.float32)
X = rng.random((500, 64)).astype(np.float32)          # 500 test "images" in [0, 1]

def quantize(t, num_bits=8):
    """Symmetric per-tensor int8: real ≈ scale * q, q in [-127, 127]."""
    scale = np.abs(t).max() / 127
    q = np.clip(np.round(t / scale), -127, 127).astype(np.int8)
    return q, scale

# Converter (once, on a laptop) quantizes W; the phone quantizes each input
Wq, w_scale = quantize(W)
Xq, x_scale = quantize(X)
bq = np.round(b / (w_scale * x_scale)).astype(np.int32)   # bias kept in int32

# Phone step: integer matmul with int32 accumulation, then rescale once
acc = Xq.astype(np.int32) @ Wq.astype(np.int32) + bq      # pure integer math
logits_int8 = acc * (w_scale * x_scale)                   # back to real units
logits_fp32 = X @ W + b

pred_fp = logits_fp32.argmax(1)
pred_q = logits_int8.argmax(1)
print("weight scale:", round(float(w_scale), 5), " example W[0,0]:",
      round(float(W[0, 0]), 4), "-> q =", int(Wq[0, 0]),
      "-> back to", round(float(Wq[0, 0] * w_scale), 4))
print("model size fp32:", W.nbytes + b.nbytes, "bytes; int8:", Wq.nbytes + bq.nbytes, "bytes")
print("max |logit error|:", round(float(np.abs(logits_fp32 - logits_int8).max()), 4))
print("predictions that agree:", f"{(pred_fp == pred_q).mean():.1%}")
probs = np.exp(logits_int8[0] - logits_int8[0].max()); probs /= probs.sum()
print("image 0 -> class", pred_q[0], "with prob", round(float(probs.max()), 3))`,
          output: `weight scale: 0.00921  example W[0,0]: 0.0377 -> q = 4 -> back to 0.0368
model size fp32: 2600 bytes; int8: 680 bytes
max |logit error|: 0.0384
predictions that agree: 99.2%
image 0 -> class 9 with prob 0.708`,
          walkthrough: [
            { lines: [5, 8], note: 'A stand-in for a trained model: random weights for one dense layer and 500 random inputs. The point is the arithmetic, not the accuracy.' },
            { lines: [10, 14], note: 'Symmetric quantisation: the largest absolute value maps to 127, so scale = max|t| / 127; every value is divided by scale, rounded and clipped to int8.' },
            { lines: [16, 19], note: 'Weights are quantised once by the converter. The bias is stored as int32 with scale w_scale × x_scale so it can be added directly to the integer accumulator, which is also how TFLite stores biases.' },
            { lines: [21, 24], note: 'The integer matrix multiply. Products of two int8 values are summed in int32, then a single multiply by w_scale × x_scale converts back to real logits.' },
            { lines: [26, 35], note: 'Compare: the model is ~3.8× smaller (680 vs 2,600 bytes; the int32 bias keeps it from being exactly 4×), logits differ by at most 0.04, and 99.2% of predictions are identical.' },
          ] },
        { type: 'chart', kind: 'bar', title: 'Size of our toy layer by number format', yLabel: 'Bytes', unit: ' B', labels: ['float32', 'float16', 'int8 (+ int32 bias)'], series: [ { name: 'Bytes', values: [2600, 1300, 680] } ], caption: 'float32 and int8 values come from the script output; float16 is 2 bytes per value (64 × 10 + 10 values × 2). The same ratios hold for real models of millions of weights.' },
        { type: 'check', question: 'In the simulation, 4 of the 500 predictions changed after quantisation. Why do a few change while most stay the same?', answer: 'Quantisation adds a small error (here at most 0.04) to each logit. When the top two classes are far apart, that error cannot change which is bigger. Only images where two classes were nearly tied flip. That is why we always re-measure accuracy on a real test set after converting.' },
      ],
    },
    {
      id: 'accelerators-and-alternatives',
      title: 'Hardware delegates and the alternatives',
      blocks: [
        { type: 'p', text: 'By default the interpreter runs on the CPU using optimised kernels. A **delegate** hands all or part of the model graph to other hardware: the **GPU delegate** runs float (and some quantised) models on the phone GPU; vendor NPU delegates target dedicated AI chips. Android\'s older NNAPI path was deprecated in Android 15, and Google now points developers to newer LiteRT acceleration options, so check the current documentation before choosing. If a delegate does not support an operation, that part falls back to the CPU, which can make a "GPU" model slower than expected.' },
        { type: 'compare', title: 'Ways to add ML to an Android app', options: [
          { name: 'TFLite / LiteRT (custom model)', summary: 'Bring your own trained model and run it with the Interpreter.', pros: ['Any task you can train', 'Full control of pre/post-processing', 'Offline and private'], cons: ['You own training, conversion, testing', 'Must match preprocessing exactly'], bestFor: 'Custom classifiers, detectors, small language or audio models' },
          { name: 'ML Kit (ready-made APIs)', summary: 'Google\'s packaged on-device APIs for common tasks like text recognition or barcode scanning.', pros: ['A few lines of code', 'No ML expertise needed'], cons: ['Only the tasks offered', 'Limited customisation'], bestFor: 'Standard tasks such as OCR, barcode, face detection' },
          { name: 'Cloud API', summary: 'Send the input to a server model over HTTP.', pros: ['Largest models', 'Instant updates'], cons: ['Needs network', 'Data leaves device', 'Per-request cost'], bestFor: 'Heavy generative tasks, rarely used features' },
        ], rows: [
          ['Works offline', 'Yes', 'Yes (for on-device APIs)', 'No'],
          ['Custom model', 'Yes', 'Limited', 'Yes (server side)'],
          ['Effort', 'Medium to high', 'Low', 'Low to medium'],
        ], verdict: 'Try ML Kit when it already solves your task; use TFLite/LiteRT when you need your own model on the device; use the cloud when the model is too big.' },
        { type: 'p', text: 'Other runtimes such as ONNX Runtime Mobile and PyTorch\'s ExecuTorch fill the same role for models trained in PyTorch. The workflow is the same shape: train, export to a mobile format, bundle, load, run.' },
      ],
    },
    {
      id: 'pitfalls',
      title: 'Common mistakes and when not to use it',
      blocks: [
        { type: 'list', items: [
          '**Compressed asset.** Forgetting `noCompress` makes memory-mapping fail when loading the model.',
          '**Shape or type mismatch.** Feeding a [28, 28] float array when the model wants [1, 28, 28, 1], or floats when a fully integer model wants int8, throws an error or returns garbage. Inspect the model\'s input and output tensors before writing app code.',
          '**Different preprocessing.** Value range, colour channels, inversion and resizing must match training exactly.',
          '**Creating an Interpreter per prediction.** Loading is slow; create it once and reuse it (an Interpreter is not thread-safe, so use one per thread or synchronise).',
          '**Running on the main thread.** Causes jank or "app not responding" dialogs.',
          '**Not measuring accuracy after quantisation.** Usually the drop is small, but some models (especially with outlier values) lose more; compare the .tflite model against the original on a test set.',
        ] },
        { type: 'callout', tone: 'tip', title: 'When not to use TFLite on-device', text: 'Skip it when the model is far too large for phones, when a ready-made API (like ML Kit) already does the job, or when the model must change daily. In those cases cloud inference or a packaged API is less work.' },
      ],
    },
  ],
  quiz: [
    { q: 'What are the two halves of TensorFlow Lite and where does each run?', options: ['A trainer on the phone that learns from users, and a converter in the cloud', 'A converter on our computer makes a .tflite file; an interpreter in the app runs it', 'A compiler that turns Kotlin into Python, and a server that runs the result', 'A dataset tool on our computer, and a labelling app that runs on the phone'], answer: 1, explain: 'The converter runs offline on a development machine and produces the compact FlatBuffer; the interpreter is a small runtime library bundled in the app. No training happens on the phone in this workflow.' },
    { q: 'Our digit app predicts "8" with 95% confidence for almost every drawing. The canvas draws black ink on a white background. What is the most likely fix?', options: ['Retrain with a bigger model so it can tell the digits apart', 'Switch to the GPU delegate so inference runs at full precision', 'Invert pixels to white strokes on black, as in the MNIST data', 'Raise setNumThreads to 8 so the interpreter is not starved'], answer: 2, explain: 'MNIST is white digits on black. Feeding inverted images is a preprocessing mismatch, so the model sees inputs unlike anything it trained on. Speed settings and bigger models do not fix a wrong input.' },
    { q: 'A weight 0.05 is quantised symmetrically with scale 0.01. What integer is stored and what value is decoded?', options: ['5, decoded as 0.05', '50, decoded as 0.5', '0, decoded as 0.0', '127, decoded as 1.27'], answer: 0, explain: 'q = round(0.05 / 0.01) = 5, and decoding gives 5 × 0.01 = 0.05. Here the value happens to land exactly on the grid, so there is no error.' },
    { q: 'Compared with float32, what does int8 post-training quantisation typically give us?', options: ['A 4× larger file that is more accurate thanks to the extra scale factors', 'Identical predictions with no change in size, since only the format changes', 'A model that must run in the cloud, because phones lack integer math units', 'About 4× smaller weights and fast integer math, with a small accuracy drop to check'], answer: 3, explain: 'One byte per weight instead of four gives about 4× smaller weights, and integer arithmetic is cheap on mobile hardware. A few predictions may change, as our simulation showed (99.2% agreement), so we re-check accuracy.' },
    { q: 'A developer creates a new Interpreter inside classify() for every drawing, and the app feels slow. Why is this a mistake?', options: ['Only one Interpreter may be created per phone boot, so the others must wait', 'Model loading and tensor allocation are costly; create it once, then reuse it', 'Each new Interpreter uploads the whole model to the cloud to be checked first', 'It is not a mistake: a fresh Interpreter per call is the recommended pattern'], answer: 1, explain: 'Each construction re-maps the model and allocates buffers. Creating it once at startup and reusing it (and closing it at the end) avoids that repeated cost. Nothing is sent to the cloud.' },
  ],
  takeaways: [
    'TFLite/LiteRT = a converter (makes a compact .tflite file) plus an interpreter (runs it on the device).',
    'Workflow: train in Python, convert (often to int8), put the file in assets uncompressed, load once, run off the main thread.',
    'int8 quantisation stores real ≈ scale × (q − zero_point); integer math with int32 accumulation is ~4× smaller and cheap on phones.',
    'Most on-device bugs are input mismatches: shape, type, value range, colour, inversion.',
    'Always re-measure accuracy after conversion, and test on low-end devices.',
  ],
  terms: [
    { term: 'TensorFlow Lite / LiteRT', def: 'Google\'s runtime for running trained models on mobile and embedded devices; renamed LiteRT in 2024.' },
    { term: '.tflite file', def: 'A FlatBuffer file holding the converted model graph and weights.' },
    { term: 'Interpreter', def: 'The TFLite runtime object that loads a .tflite model and runs inference.' },
    { term: 'Tensor', def: 'A multi-dimensional array of numbers, such as an image of shape [1, 28, 28, 1].' },
    { term: 'Post-training quantisation', def: 'Converting a trained float model to lower-precision integers without retraining.' },
    { term: 'Representative dataset', def: 'A small set of real inputs the converter uses to measure value ranges for quantisation.' },
    { term: 'Delegate', def: 'A plugin that runs part or all of a TFLite model on other hardware such as a GPU or NPU.' },
  ],
};
