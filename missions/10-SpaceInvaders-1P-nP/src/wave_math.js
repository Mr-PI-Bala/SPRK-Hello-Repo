/*
  Wave number math labels for Space Invaders celebrations.
  Student-safe insights — one primary theme per wave when several apply.
*/

const WAVE_MATH = (() => {
  const PI_MILESTONE_WAVES = new Set([3, 31, 314, 3141, 31415, 314159]);
  const PHI_MILESTONE_WAVES = new Set([16, 161, 1618, 16180]);
  const E_MILESTONE_WAVES = new Set([2, 7, 71, 271, 2718]);
  const THETA_ANGLE_WAVES = new Set([30, 45, 60, 90, 120, 180, 270, 360]);
  const FIBONACCI_SEED = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765];

  function isPrime(n) {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    for (let d = 3; d * d <= n; d += 2) {
      if (n % d === 0) return false;
    }
    return true;
  }

  function isPerfectSquare(n) {
    if (n < 0) return false;
    const root = Math.sqrt(n);
    return Number.isInteger(root);
  }

  function isFibonacci(n) {
    if (n < 0) return false;
    if (FIBONACCI_SEED.includes(n)) return true;
    return isPerfectSquare(5 * n * n + 4) || isPerfectSquare(5 * n * n - 4);
  }

  function isPalindrome(n) {
    const text = String(n);
    return text === text.split("").reverse().join("");
  }

  function isTriangular(n) {
    if (n < 1) return false;
    const test = 8 * n + 1;
    return isPerfectSquare(test);
  }

  function isPerfectSquareNumber(n) {
    return n > 0 && isPerfectSquare(n);
  }

  function isPowerOfTwo(n) {
    return n > 0 && (n & (n - 1)) === 0;
  }

  function isPowerOfThree(n) {
    if (n < 1) return false;
    let value = 1;
    while (value < n) value *= 3;
    return value === n;
  }

  function digitSum(n) {
    return String(n).split("").reduce((sum, ch) => sum + Number(ch), 0);
  }

  function isHappyNumber(n) {
    const seen = new Set();
    let value = n;
    while (value !== 1 && !seen.has(value)) {
      seen.add(value);
      value = digitSum(value);
    }
    return value === 1;
  }

  function isLucas(n) {
    if (n === 2 || n === 1) return true;
    let a = 2;
    let b = 1;
    while (b < n) {
      const next = a + b;
      a = b;
      b = next;
    }
    return b === n;
  }

  function previousPrime(n) {
    let candidate = n - 1;
    while (candidate >= 2) {
      if (isPrime(candidate)) return candidate;
      candidate -= 1;
    }
    return null;
  }

  function candidatesForWave(wave) {
    const list = [];

    if (isPrime(wave) && wave >= 3) {
      const prev = previousPrime(wave);
      list.push({
        id: "prime",
        priority: 100,
        eyebrow: "Prime power wave",
        title: `Wave ${wave} is prime`,
        insight: prev
          ? `After wave ${prev}, you reached the next prime. ${wave} has exactly two factors: 1 and ${wave}. Primes are the atoms of multiplication — every whole number breaks apart into primes.`
          : `${wave} is prime: its only factors are 1 and ${wave}. Prime numbers never end — they keep appearing forever along the number line.`,
        badge: "Prime",
      });
    }

    if (isFibonacci(wave)) {
      list.push({
        id: "fibonacci",
        priority: 90,
        eyebrow: "Fibonacci fleet",
        title: `Wave ${wave} in the Fibonacci sequence`,
        insight: `Each Fibonacci number is the sum of the two before it (…8, 13, 21, ${wave === 21 ? "" : `…${wave}`}). Spirals in sunflowers, pinecones, and galaxies often grow with Fibonacci spacing.`,
        badge: "Fibonacci",
      });
    }

    if (PI_MILESTONE_WAVES.has(wave)) {
      list.push({
        id: "pi",
        priority: 88,
        eyebrow: "Pi milestone",
        title: `Wave ${wave} echoes π`,
        insight: `The digits of π begin 3.14159… Your wave number ${wave} appears in that famous constant. Pi links circles, waves, and orbits — the ratio of any circle's circumference to its diameter.`,
        badge: "π",
      });
    }

    if (PHI_MILESTONE_WAVES.has(wave)) {
      list.push({
        id: "phi",
        priority: 86,
        eyebrow: "Golden ratio",
        title: `Wave ${wave} nods to φ (phi)`,
        insight: `φ ≈ 1.618 is the golden ratio. Artists and architects use it for balanced proportions. It appears when Fibonacci ratios settle toward infinity.`,
        badge: "φ",
      });
    }

    if (E_MILESTONE_WAVES.has(wave)) {
      list.push({
        id: "euler",
        priority: 84,
        eyebrow: "Euler's number",
        title: `Wave ${wave} connects to e`,
        insight: `e ≈ 2.71828… grows naturally in compound interest, population models, and cooling curves. It is the base of the natural logarithm.`,
        badge: "e",
      });
    }

    if (THETA_ANGLE_WAVES.has(wave)) {
      list.push({
        id: "theta",
        priority: 82,
        eyebrow: "Angle wave",
        title: `Wave ${wave}° — theta geometry`,
        insight: `In trigonometry, θ (theta) often marks an angle. ${wave}° is a familiar angle on the unit circle — think slices of a full 360° turn.`,
        badge: "θ",
      });
    }

    if (isPalindrome(wave) && wave >= 10) {
      list.push({
        id: "palindrome",
        priority: 70,
        eyebrow: "Palindrome patrol",
        title: `Wave ${wave} reads the same both ways`,
        insight: `A palindrome looks identical forward and backward. Dates like 02/02/2020 and numbers like ${wave} share that mirror magic.`,
        badge: "Palindrome",
      });
    }

    if (isPerfectSquareNumber(wave)) {
      list.push({
        id: "square",
        priority: 65,
        eyebrow: "Perfect square",
        title: `Wave ${wave} is n × n`,
        insight: `${wave} = ${Math.sqrt(wave)}². Square numbers appear when you tile equal rows and columns — classic arcade grids love squares.`,
        badge: "n²",
      });
    }

    if (isTriangular(wave)) {
      const k = (Math.sqrt(8 * wave + 1) - 1) / 2;
      list.push({
        id: "triangular",
        priority: 63,
        eyebrow: "Triangular number",
        title: `Wave ${wave} stacks like bowling pins`,
        insight: `Triangular numbers count dots in a triangle: 1, 3, 6, 10, … Wave ${wave} is the ${k}th triangle number. Add the first ${k} integers and you get ${wave}.`,
        badge: "△",
      });
    }

    if (isPowerOfTwo(wave)) {
      list.push({
        id: "power2",
        priority: 60,
        eyebrow: "Power of two",
        title: `Wave ${wave} = 2^${Math.log2(wave)}`,
        insight: `Computers think in powers of two (2, 4, 8, 16…). Each bit doubles the count — that is why ${wave} feels so at home in digital space invaders.`,
        badge: "2ⁿ",
      });
    }

    if (isPowerOfThree(wave)) {
      list.push({
        id: "power3",
        priority: 58,
        eyebrow: "Power of three",
        title: `Wave ${wave} is a cube of threes`,
        insight: `${wave} = 3^${Math.round(Math.log(wave) / Math.log(3))}. Powers of three show up in fractals and volume scaling.`,
        badge: "3ⁿ",
      });
    }

    if (wave >= 10 && isHappyNumber(wave)) {
      list.push({
        id: "happy",
        priority: 55,
        eyebrow: "Happy number",
        title: `Wave ${wave} is happy`,
        insight: `Replace ${wave} with the sum of the squares of its digits and keep going — a happy number eventually reaches 1. Unhappy numbers loop forever without hitting 1.`,
        badge: "☺",
      });
    }

    if (isLucas(wave) && wave > 2) {
      list.push({
        id: "lucas",
        priority: 52,
        eyebrow: "Lucas sequence",
        title: `Wave ${wave} joins the Lucas family`,
        insight: `Lucas numbers follow the same addition rule as Fibonacci but start with 2 and 1. They appear in phyllotaxis and tiling puzzles.`,
        badge: "Lucas",
      });
    }

    if (wave % 10 === 0 && wave >= 10) {
      list.push({
        id: "decade",
        priority: 40,
        eyebrow: "Decade marker",
        title: `Wave ${wave} — base-10 milestone`,
        insight: `Our number system is base ten because humans often count on fingers. Every time you hit a multiple of 10, you have completed another full bundle of tens.`,
        badge: "×10",
      });
    }

    return list.sort((a, b) => b.priority - a.priority);
  }

  function getCelebration(wave) {
    const matches = candidatesForWave(wave);
    if (matches.length === 0) return null;
    const primary = matches[0];
    const also = matches.slice(1, 4).map((item) => item.badge);
    return {
      wave,
      primary,
      also,
      headline: primary.title,
      insight: primary.insight,
      eyebrow: primary.eyebrow,
      badge: primary.badge,
      extraLine: also.length > 0
        ? `This wave is also special for: ${also.join(", ")}.`
        : "",
    };
  }

  return {
    getCelebration,
    isPrime,
    isFibonacci,
    candidatesForWave,
  };
})();
