/*** Source: https://github.com/vkandy/simhash-js  ***/
/**
 * Simhash class. Creates a 32-bit simhash.
 *
 * // Usage: 
 * var hash = Simhash.of("This is a test");
 *
 * // Override default values
 * var simhash = new Simhash();
 * var hash = simhash.of("This is a test", {
 *      kshingles: 2,
 *      maxFeatures: 32    
 * });
 */
function Simhash(options) {
    /**
     * By default, we tokenize input into chunks of this size.
     */
    var kshingles = typeof(options) != 'undefined' && typeof(options['kshingles']) != 'undefined' ? options['kshingles'] : 4;

    /**
     * By default, this many number of minimum shingles will 
     * be combined to create the final hash.
     */
    var maxFeatures = typeof(options) != 'undefined' && typeof(options['maxFeatures']) != 'undefined' ? options['maxFeatures'] : 128;

    // --------------------------------------------------
    // Public access
    // --------------------------------------------------

    /**
     * Driver function.
     */
    this.of = function(input, options) {
        var tokens = tokenize(input);
        var shingles = [];
        var jenkins = new Jenkins();
        for(var i in tokens) {
            shingles.push(jenkins.hash32(tokens[i]));
        }
        var simhash = combineShingles(shingles);
        simhash >>>= 0;
        return simhash;
    };

    // --------------------------------------------------
    // Private methods
    // --------------------------------------------------

    /**
     * TODO: Make this private or take closure that implements 
     * logic to combine shingles.
     */
function combineShingles(shingles) {
        if(shingles.length == 0) return;

        if(shingles.length == 1) return shingles[0];

        shingles.sort(hashComparator);
        if(shingles.length > maxFeatures) shingles = shingles.splice(maxFeatures);

        var simhash = 0x0;
        var mask = 0x1;
        for(var pos = 0; pos < 32; pos++) {
            var weight = 0;
            for(var i in shingles) {
                shingle = parseInt(shingles[i],16);
                weight += !(~shingle & mask) == 1 ? 1 : -1;
            }
            if(weight > 0) simhash |= mask;
            mask <<= 1;
        }

        return simhash;
    };

    /**
     * Tokenizes input into 'kshingles' number of tokens.
     */
function tokenize(original) {
	var parts = original.split(" ");
	var shingles = new Array();
	parts.forEach(function(part){
		var size = part.length;
		if(size <= kshingles) {
		    shingles.push(part.substr(0));
		    return;
		}

		for (var i = 0; i < size; i = i + kshingles) {
		    shingles.push(i + kshingles < size ? part.slice(i, i + kshingles) : part.slice(i));
		}
	});
        return shingles;
    };

    /**
     * TODO: Use a priority queue. Till then this comparator is 
     * used to find the least 'maxFeatures' shingles.
     */
function hashComparator (x, y) {
		var a = parseInt(x, 16);
		var b = parseInt(y, 16);
        return a < b ? -1 : (a > b ? 1 : 0);
    };
}
    /**
     * Calculates binary hamming distance of two base 16 integers.
     */
Simhash.hammingDistanceSlow = function(x, y) {
        var distance = 0;
        var val = parseInt(x, 16) ^ parseInt(y, 16);
        while(val) {
            ++distance;
            val &= val - 1;
        }
        return distance;
    };

    /**
     * Calculates binary hamming distance of two base 16 integers.
     */
Simhash.hammingDistance = function(x, y) {
        var a1 = parseInt(x, 16);
        var a2 = parseInt(y, 16);
	    var v1 = a1^a2;
	    var v2 = (a1^a2)>>32;

	    v1 = v1 - ((v1>>1) & 0x55555555);
	    v2 = v2 - ((v2>>1) & 0x55555555);
	    v1 = (v1 & 0x33333333) + ((v1>>2) & 0x33333333);
	    v2 = (v2 & 0x33333333) + ((v2>>2) & 0x33333333);
	    var c1 = ((v1 + (v1>>4) & 0xF0F0F0F) * 0x1010101) >> 24;
	    var c2 = ((v2 + (v2>>4) & 0xF0F0F0F) * 0x1010101) >> 24;

	    return c1 + c2;
    };
    /**
     * Calculates bit-wise similarity - Jaccard index.
     */
Simhash.similarity = function(x, y) {
        var x16 = parseInt(x, 16);
        var y16 = parseInt(y, 16);
        var i = (x16 & y16);
        var u = (x16 | y16);
        return Simhash.hammingWeight(i) / Simhash.hammingWeight(u);
    };

    /**
     * Calculates Hamming weight (population count).
     */
Simhash.hammingWeight = function(l) {
        var c;
        for(c = 0; l; c++) l &= l-1;
        return c;
    };


/**
 * Jenkins hash implementation which yeilds 32-bit and 64-bit hashes.
 *
 * See https://github.com/vkandy/jenkins-hash-js
 */
function Jenkins() {
    /**
     * Default first initial seed.
     */
    var pc = 0;

    /**
     * Default second initial seed.
     */
    var pb = 0;

    // --------------------------------------------------
    // Public access
    // --------------------------------------------------

    /**
     * Computes and returns 32-bit hash of given message.
     */
    this.hash32 = function(msg) {
        var h = implement.hashlittle2(msg, pc, pb);
        return (h.c).toString(16);
    };

    /**
     * Computes and returns 32-bit hash of given message.
     */
    this.hash64 = function(msg) {
        var h = implement.hashlittle2(msg, pc, pb);
        return (h.b).toString(16) + (h.c).toString(16);
    };

    // --------------------------------------------------
    // Private methods
    // --------------------------------------------------

    /**
     * Implementation of lookup3 algorithm.
     */
    var implement = {
rot: function(x,k) {
	     return (x<<k) | (x>>>(32-k));
     },

mix: function(a,b,c) {
	     a = (a - c) | 0;  a ^= implement.rot(c, 4);  c = (c + b) | 0;
	     b = (b - a) | 0;  b ^= implement.rot(a, 6);  a = (a + c) | 0;
	     c = (c - b) | 0;  c ^= implement.rot(b, 8);  b = (b + a) | 0;
	     a = (a - c) | 0;  a ^= implement.rot(c,16);  c = (c + b) | 0;
	     b = (b - a) | 0;  b ^= implement.rot(a,19);  a = (a + c) | 0;
	     c = (c - b) | 0;  c ^= implement.rot(b, 4);  b = (b + a) | 0;
	     return {a : a, b : b, c : c};
     },

final: function(a,b,c) {
	       c ^= b; c -= implement.rot(b,14) | 0;
	       a ^= c; a -= implement.rot(c,11) | 0;
	       b ^= a; b -= implement.rot(a,25) | 0;
	       c ^= b; c -= implement.rot(b,16) | 0;
	       a ^= c; a -= implement.rot(c,4) | 0;
	       b ^= a; b -= implement.rot(a,14) | 0;
	       c ^= b; c -= implement.rot(b,24) | 0;
	       return {a : a, b : b, c : c};
       },  

hashlittle2: function(k, initval, initval2) {
		     var length = k.length;
		     a = b = c = 0xdeadbeef + length + initval;
		     c += initval2;

		     offset = 0;
		     while (length > 12) {
			     a += (k.charCodeAt(offset+0) + (k.charCodeAt(offset+1)<<8) + (k.charCodeAt(offset+2)<<16) + (k.charCodeAt(offset+3)<<24)); a = a>>>0;
			     b += (k.charCodeAt(offset+4) + (k.charCodeAt(offset+5)<<8) + (k.charCodeAt(offset+6)<<16) + (k.charCodeAt(offset+7)<<24)); b = b>>>0;
			     c += (k.charCodeAt(offset+8) + (k.charCodeAt(offset+9)<<8) + (k.charCodeAt(offset+10)<<16) + (k.charCodeAt(offset+11)<<24)); c = c>>>0;
			     o = implement.mix(a,b,c);
			     a = o.a; b = o.b; c = o.c;
			     length -= 12;
			     offset += 12;
		     }

		     switch(length) {
			     case 12: c += (k.charCodeAt(offset+8) + (k.charCodeAt(offset+9)<<8) + (k.charCodeAt(offset+10)<<16) + (k.charCodeAt(offset+11)<<24)); b += (k.charCodeAt(offset+4) + (k.charCodeAt(offset+5)<<8) + (k.charCodeAt(offset+6)<<16) + (k.charCodeAt(offset+7)<<24)); a += (k.charCodeAt(offset+0) + (k.charCodeAt(offset+1)<<8) + (k.charCodeAt(offset+2)<<16) + (k.charCodeAt(offset+3)<<24)); break;
			     case 11: c += (k.charCodeAt(offset+8) + (k.charCodeAt(offset+9)<<8) + (k.charCodeAt(offset+10)<<16)); b += (k.charCodeAt(offset+4) + (k.charCodeAt(offset+5)<<8) + (k.charCodeAt(offset+6)<<16) + (k.charCodeAt(offset+7)<<24)); a += (k.charCodeAt(offset+0) + (k.charCodeAt(offset+1)<<8) + (k.charCodeAt(offset+2)<<16) + (k.charCodeAt(offset+3)<<24)); break;
			     case 10: c += (k.charCodeAt(offset+8) + (k.charCodeAt(offset+9)<<8)); b += (k.charCodeAt(offset+4) + (k.charCodeAt(offset+5)<<8) + (k.charCodeAt(offset+6)<<16) + (k.charCodeAt(offset+7)<<24)); a += (k.charCodeAt(offset+0) + (k.charCodeAt(offset+1)<<8) + (k.charCodeAt(offset+2)<<16) + (k.charCodeAt(offset+3)<<24)); break;
			     case 9: c += (k.charCodeAt(offset+8)); b += (k.charCodeAt(offset+4) + (k.charCodeAt(offset+5)<<8) + (k.charCodeAt(offset+6)<<16) + (k.charCodeAt(offset+7)<<24)); a += (k.charCodeAt(offset+0) + (k.charCodeAt(offset+1)<<8) + (k.charCodeAt(offset+2)<<16) + (k.charCodeAt(offset+3)<<24)); break;
			     case 8: b += (k.charCodeAt(offset+4) + (k.charCodeAt(offset+5)<<8) + (k.charCodeAt(offset+6)<<16) + (k.charCodeAt(offset+7)<<24)); a += (k.charCodeAt(offset+0) + (k.charCodeAt(offset+1)<<8) + (k.charCodeAt(offset+2)<<16) + (k.charCodeAt(offset+3)<<24)); break;
			     case 7: b += (k.charCodeAt(offset+4) + (k.charCodeAt(offset+5)<<8) + (k.charCodeAt(offset+6)<<16)); a += (k.charCodeAt(offset+0) + (k.charCodeAt(offset+1)<<8) + (k.charCodeAt(offset+2)<<16) + (k.charCodeAt(offset+3)<<24)); break;
			     case 6: b += ((k.charCodeAt(offset+5)<<8) + k.charCodeAt(offset+4)); a += (k.charCodeAt(offset+0) + (k.charCodeAt(offset+1)<<8) + (k.charCodeAt(offset+2)<<16) + (k.charCodeAt(offset+3)<<24)); break;
			     case 5: b += (k.charCodeAt(offset+4)); a += (k.charCodeAt(offset+0) + (k.charCodeAt(offset+1)<<8) + (k.charCodeAt(offset+2)<<16) + (k.charCodeAt(offset+3)<<24)); break;
			     case 4: a += (k.charCodeAt(offset+0) + (k.charCodeAt(offset+1)<<8) + (k.charCodeAt(offset+2)<<16) + (k.charCodeAt(offset+3)<<24)); break;
			     case 3: a += (k.charCodeAt(offset+0) + (k.charCodeAt(offset+1)<<8) + (k.charCodeAt(offset+2)<<16)); break;
			     case 2: a += (k.charCodeAt(offset+0) + (k.charCodeAt(offset+1)<<8)); break;
			     case 1: a += (k.charCodeAt(offset+0)); break;
			     case 0: return {b : b, c : c};
		     }

		     o = implement.final(a,b,c);
		     a = o.a; b = o.b; c = o.c;

		     return {b : b>>>0, c : c>>>0};
	     }    
    };
}
exports["Simhash"] = Simhash;
