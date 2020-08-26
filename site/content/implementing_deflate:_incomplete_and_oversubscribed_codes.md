Deflate's dynamically encoded blocks (block type 2) use custom huffman codes generated on the fly for each block. In order for these codes to then be interpreted, the decompressor must be able to recreate the code, and so the huffman tree must be stored in the file.

Naive huffman coding implementations may simply serialize the full code, writing information such as the code itself, and bit length for each symbol. However these trees quickly take up large amounts of space, and can result in a net negative for compression.

Deflate is more precise. It transmits only the bit lengths for each symbol, in order, and recomputes the codes in a pre-coordinated way (this general technique is known as canonical huffman coding). This is done using the principles illustrated by the following animation:

![Converting bit lengths to codes](/res/length_to_code.gif)

There are some rules that define an optimal relationship between the lengths of a given code. They are essentially the same properties laid out by David A. Huffman in the famous paper "A Method for the Construction of Minimum Redundancy Codes." For example, no code should go unused. If there is an unused code of length `n`, and a code of length `n + 1` is being used, then the code of length `n + 1` could simply be reassigned to the code of length `n`, and a more optimal code would be produced.

zlib refers to codes with unused bit patterns like this as "incomplete." Although it is possible to produce an incomplete but still correct code, it is considered that no reasonable program would want to do that, and so it is treated as an error.

It is also possible for a code to list too many symbols on the same bit length. For example, since deflate is a binary huffman code, a simple example would be to provide a code with 3 symbols with a bit length of 1.
 
 zlib refers to these codes as "over-subscribed," and returns an error for these codes as well, seeing as there is no reasonable way to interpret such a code.

 The following code snippet from `inftrees.c` in zlib detects both incomplete and over-subscribed codes:

<pre><code class="language-c" data-ln-start-from="130">    /* check for an over-subscribed or incomplete set of lengths */
    left = 1;
    for (len = 1; len <= MAXBITS; len++) {
        left <<= 1;
        left -= count[len];
        if (left < 0) return -1;        /* over-subscribed */
    }
    if (left > 0 && (type == CODES || max != 1))
        return -1;                      /* incomplete set */
</code></pre>

If you trigger either of these errors, you're likely making an error in calculating your bit lengths, or in writing them out to the file. In my case, I made an off-by-one error when calculating `hlen`, and so I wrote out all code lengths except the last, resulting in an incomplete code. This is a point in favor of returning an error on incomplete codes!

I would like to take this opportunity to say Mark Adler is a goated baller legend-man and without his consistent presence on StackOverflow, implementing deflate would have taken me much longer.

