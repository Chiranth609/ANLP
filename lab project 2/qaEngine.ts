// Port of the Python "Hybrid QA Chatbot" notebook logic.
// Runs entirely in the browser: TF-IDF retrieval + knowledge base +
// dialogue manager + lightweight answer extraction (no spaCy needed).

export interface QAResult {
  answer: string;
  source: string;
  confidence: number;
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'where',
  'who', 'what', 'why', 'how', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'of', 'in', 'on', 'at', 'to', 'for',
  'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'from', 'up', 'down', 'out', 'over', 'under',
  'again', 'further', 'once', 'here', 'there', 'all', 'any', 'both', 'each',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
  'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should',
  'now', 'this', 'that', 'these', 'those', 'it', 'its', 'as', 'by',
]);

// ---------------------------------------------------------------------------
// Document corpus — expanded to cover many topics
// ---------------------------------------------------------------------------

const DOCUMENTS: string[] = [
  // Programming languages
  'Python was created by Guido van Rossum and was first released in 1991. Python is a high-level programming language known for its simple syntax and readability.',
  'JavaScript was created by Brendan Eich in 1995. JavaScript is a programming language commonly used to create interactive web applications and runs in web browsers.',
  'Java was created by James Gosling at Sun Microsystems and was released in 1995. Java is a general-purpose programming language designed to have fewer implementation dependencies.',
  'C++ was created by Bjarne Stroustrup and was released in 1985. C++ is an extension of the C programming language that adds object-oriented features.',
  'C was created by Dennis Ritchie at Bell Labs in 1972. C is a general-purpose programming language widely used for system programming.',
  'Ruby was created by Yukihiro Matsumoto and was first released in 1995. Ruby is a programming language focused on simplicity and productivity.',
  'PHP was created by Rasmus Lerdorf and was first released in 1995. PHP is a server-side scripting language used for web development.',
  'Swift was created by Chris Lattner and was released by Apple in 2014. Swift is a programming language used for iOS and macOS application development.',
  'Go was created by Robert Griesemer, Rob Pike, and Ken Thompson at Google and was released in 2009. Go is a statically typed programming language designed for simplicity and efficiency.',
  'Kotlin was created by JetBrains and was first released in 2011. Kotlin is a programming language that runs on the Java Virtual Machine and is used for Android development.',
  'TypeScript was created by Microsoft and was first released in 2012. TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.',

  // Web technologies
  'HTML stands for HyperText Markup Language and is used to structure web pages. HTML was created by Tim Berners-Lee in 1991.',
  'CSS stands for Cascading Style Sheets and is used to style web pages. CSS was first proposed by Hakon Wium Lie in 1994.',
  'React is a JavaScript library for building user interfaces. React was created by Facebook and was first released in 2013.',
  'Angular is a TypeScript-based web application framework. Angular was created by Google and was first released in 2010.',
  'Vue is a JavaScript framework for building user interfaces. Vue was created by Evan You and was first released in 2014.',
  'Node.js is a JavaScript runtime built on the V8 engine. Node.js was created by Ryan Dahl and was first released in 2009.',

  // AI / ML / Data Science
  'Artificial Intelligence is a branch of computer science that focuses on creating machines capable of performing tasks that normally require human intelligence.',
  'Machine Learning is a subset of Artificial Intelligence that allows computers to learn patterns from data without being explicitly programmed.',
  'Natural Language Processing is a field of Artificial Intelligence that enables computers to understand and process human language.',
  'Deep Learning is a subset of Machine Learning that uses artificial neural networks with multiple layers.',
  'TensorFlow is an open-source machine learning framework developed by Google. TensorFlow was released in 2015.',
  'PyTorch is an open-source machine learning framework developed by Facebook. PyTorch was released in 2016.',
  'Scikit-learn is a machine learning library for Python. Scikit-learn was initially released in 2010.',
  'Data Science is an interdisciplinary field that uses scientific methods, processes, and algorithms to extract knowledge from data.',
  'Computer Vision is a field of Artificial Intelligence that trains computers to interpret and understand visual information from images and videos.',
  'ChatGPT is an AI language model developed by OpenAI. ChatGPT was released in November 2022 and is based on the GPT architecture.',

  // Geography — Countries and capitals
  'India is a country in South Asia. The capital of India is New Delhi. India gained independence on August 15, 1947.',
  'The capital of Karnataka is Bengaluru. Karnataka is a state in southern India.',
  'The capital of Maharashtra is Mumbai. Mumbai is the financial capital of India.',
  'The capital of Tamil Nadu is Chennai. Tamil Nadu is a state in southern India.',
  'The capital of West Bengal is Kolkata. West Bengal is a state in eastern India.',
  'The capital of the United States is Washington, D.C. The United States has 50 states.',
  'The capital of the United Kingdom is London. The United Kingdom consists of England, Scotland, Wales, and Northern Ireland.',
  'The capital of France is Paris. France is a country in Western Europe.',
  'The capital of Germany is Berlin. Germany is a country in Central Europe.',
  'The capital of Japan is Tokyo. Japan is an island country in East Asia.',
  'The capital of China is Beijing. China is a country in East Asia and the most populous country in the world.',
  'The capital of Australia is Canberra. Australia is a country and continent in the Southern Hemisphere.',
  'The capital of Canada is Ottawa. Canada is a country in North America.',
  'The capital of Russia is Moscow. Russia is the largest country in the world by area.',
  'The capital of Italy is Rome. Italy is a country in Southern Europe.',
  'The capital of Spain is Madrid. Spain is a country in Southwestern Europe.',
  'The capital of Brazil is Brasilia. Brazil is the largest country in South America.',
  'The capital of Egypt is Cairo. Egypt is a country in North Africa.',
  'The capital of South Korea is Seoul. South Korea is a country in East Asia.',

  // Science
  'Water is composed of two hydrogen atoms and one oxygen atom. The chemical formula of water is H2O.',
  'The speed of light in a vacuum is approximately 299,792 kilometers per second. The speed of light is a fundamental constant in physics.',
  'Gravity is a force that attracts objects toward each other. The theory of gravity was developed by Isaac Newton and later refined by Albert Einstein.',
  'The Earth is the third planet from the Sun in the Solar System. The Earth has one natural satellite, the Moon.',
  'The Sun is a star at the center of the Solar System. The Sun is approximately 4.6 billion years old.',
  'DNA stands for Deoxyribonucleic Acid. DNA carries the genetic instructions for the development and functioning of living organisms.',
  'Photosynthesis is the process by which plants convert sunlight, water, and carbon dioxide into oxygen and sugar.',
  'The periodic table is a tabular arrangement of chemical elements organized by their atomic number. The periodic table was created by Dmitri Mendeleev in 1869.',
  'The human body has 206 bones in an adult skeleton. The human heart has four chambers.',
  'Oxygen is a chemical element with the symbol O and atomic number 8. Oxygen is essential for respiration in living organisms.',
  'Carbon dioxide is a greenhouse gas with the chemical formula CO2. Carbon dioxide is produced by respiration and combustion.',

  // History
  'World War I began in 1914 and ended in 1918. World War I was fought between the Allied Powers and the Central Powers.',
  'World War II began in 1939 and ended in 1945. World War II was fought between the Allied Powers and the Axis Powers.',
  'India gained independence from British rule on August 15, 1947. The first Prime Minister of India was Jawaharlal Nehru.',
  'Mahatma Gandhi was born on October 2, 1869. Mahatma Gandhi led the Indian independence movement through nonviolent civil disobedience.',
  'Albert Einstein was born in 1879 and died in 1955. Albert Einstein developed the theory of relativity and the famous equation E=mc2.',
  'Isaac Newton was born in 1642 and died in 1727. Isaac Newton formulated the laws of motion and universal gravitation.',
  'Charles Darwin was born in 1809 and died in 1882. Charles Darwin developed the theory of evolution by natural selection.',
  'The Great Wall of China was built over many centuries. The Great Wall of China is approximately 21,196 kilometers long.',
  'The Taj Mahal was built by Mughal Emperor Shah Jahan in memory of his wife Mumtaz Mahal. The Taj Mahal is located in Agra, India.',
  'The Pyramids of Giza were built as tombs for pharaohs in ancient Egypt. The Great Pyramid was built around 2560 BC.',

  // Technology
  'The Internet is a global network of interconnected computers that communicate using standardized protocols. The Internet was developed from ARPANET in the late 1960s.',
  'The World Wide Web was invented by Tim Berners-Lee in 1989. The World Wide Web is an information system that operates over the Internet.',
  'HTTP stands for HyperText Transfer Protocol. HTTP is the protocol used for transmitting data over the World Wide Web.',
  'HTTPS stands for HyperText Transfer Protocol Secure. HTTPS uses encryption to secure data transmitted over the Internet.',
  'TCP stands for Transmission Control Protocol. TCP is one of the main protocols used on the Internet for reliable data transmission.',
  'IP stands for Internet Protocol. IP is responsible for addressing and routing packets between computers on a network.',
  'SQL stands for Structured Query Language. SQL is used to manage and manipulate relational databases.',
  'Linux is an open-source operating system kernel created by Linus Torvalds in 1991. Linux is widely used in servers and embedded systems.',
  'Android is a mobile operating system developed by Google. Android was first released in 2008 and is based on the Linux kernel.',
  'iOS is a mobile operating system developed by Apple. iOS was first released in 2007 with the original iPhone.',
  'Cloud computing is the delivery of computing services over the Internet. Cloud computing includes servers, storage, databases, and software.',
  'Blockchain is a distributed ledger technology that records transactions across many computers. Blockchain was introduced by Satoshi Nakamoto in 2008.',
  'Bitcoin is a cryptocurrency created by Satoshi Nakamoto in 2009. Bitcoin was the first decentralized cryptocurrency.',
  '5G is the fifth generation of mobile network technology. 5G offers faster data speeds and lower latency than 4G.',

  // Math
  'Pi is a mathematical constant approximately equal to 3.14159. Pi is the ratio of a circle circumference to its diameter.',
  'The Fibonacci sequence is a series of numbers where each number is the sum of the two preceding ones. The Fibonacci sequence starts with 0 and 1.',
  'A prime number is a natural number greater than 1 that has no positive divisors other than 1 and itself. The first prime numbers are 2, 3, 5, 7, 11, and 13.',
  'The Pythagorean theorem states that in a right triangle, the square of the hypotenuse equals the sum of the squares of the other two sides. The Pythagorean theorem was attributed to Pythagoras.',

  // Space
  'The Solar System consists of the Sun and eight planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune. Pluto was reclassified as a dwarf planet in 2006.',
  'The Milky Way is the galaxy that contains the Solar System. The Milky Way is a spiral galaxy with approximately 100 billion stars.',
  'A black hole is a region of spacetime where gravity is so strong that nothing can escape from it. Black holes are formed from collapsed stars.',
  'The Moon is the natural satellite of the Earth. The Moon orbits the Earth at an average distance of 384,400 kilometers.',
  'Mars is the fourth planet from the Sun. Mars is often called the Red Planet due to its reddish appearance from iron oxide.',
  'Jupiter is the largest planet in the Solar System. Jupiter is a gas giant with a famous feature called the Great Red Spot.',
  'Saturn is the sixth planet from the Sun. Saturn is known for its prominent ring system made of ice and rock particles.',

  // Health & Biology
  'The human brain is the central organ of the human nervous system. The human brain weighs approximately 1.4 kilograms.',
  'The human heart pumps blood throughout the body. The human heart beats approximately 72 times per minute.',
  'Proteins are essential nutrients for the human body. Proteins are made up of amino acids and are important for building muscles and tissues.',
  'Vitamins are organic compounds required in small amounts for proper body function. Vitamin C is important for immune system support.',
  'Blood is composed of red blood cells, white blood cells, platelets, and plasma. There are four main blood types: A, B, AB, and O.',

  // Economics & Business
  'GDP stands for Gross Domestic Product. GDP measures the total value of goods and services produced in a country.',
  'Inflation is the rate at which the general level of prices for goods and services rises. Inflation reduces the purchasing power of money.',
  'A stock market is a marketplace where shares of publicly traded companies are bought and sold. The largest stock exchange is the New York Stock Exchange.',
];

// ---------------------------------------------------------------------------
// TF-IDF vectorizer
// ---------------------------------------------------------------------------

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0 && !STOP_WORDS.has(t));
}

function buildVocabulary(docs: string[][]): Map<string, number> {
  const vocab = new Map<string, number>();
  let idx = 0;
  for (const tokens of docs) {
    for (const t of tokens) {
      if (!vocab.has(t)) {
        vocab.set(t, idx++);
      }
    }
  }
  return vocab;
}

function termFrequency(tokens: string[], vocab: Map<string, number>): Float64Array {
  const vec = new Float64Array(vocab.size);
  for (const t of tokens) {
    const i = vocab.get(t);
    if (i !== undefined) vec[i] += 1;
  }
  return vec;
}

function computeIdf(docs: string[][], vocab: Map<string, number>): Float64Array {
  const df = new Float64Array(vocab.size);
  for (const tokens of docs) {
    const seen = new Set(tokens);
    for (const t of seen) {
      const i = vocab.get(t);
      if (i !== undefined) df[i] += 1;
    }
  }
  const idf = new Float64Array(vocab.size);
  const n = docs.length;
  for (let i = 0; i < vocab.size; i++) {
    idf[i] = Math.log((1 + n) / (1 + df[i])) + 1; // smoothed idf
  }
  return idf;
}

function tfidf(tokens: string[], vocab: Map<string, number>, idf: Float64Array): Float64Array {
  const tf = termFrequency(tokens, vocab);
  const vec = new Float64Array(vocab.size);
  for (let i = 0; i < vocab.size; i++) {
    vec[i] = tf[i] * idf[i];
  }
  // L2 normalize
  let norm = 0;
  for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < vec.length; i++) vec[i] /= norm;
  return vec;
}

const tokenizedDocs = DOCUMENTS.map(tokenize);
const VOCAB = buildVocabulary(tokenizedDocs);
const IDF = computeIdf(tokenizedDocs, VOCAB);
const DOC_VECTORS = tokenizedDocs.map((t) => tfidf(t, VOCAB, IDF));

function cosineSimilarity(a: Float64Array, b: Float64Array): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // vectors already L2-normalized
}

function retrieveDocument(question: string): { document: string; score: number; index: number } {
  const qVec = tfidf(tokenize(question), VOCAB, IDF);
  let bestIdx = 0;
  let bestScore = -Infinity;
  for (let i = 0; i < DOC_VECTORS.length; i++) {
    const s = cosineSimilarity(qVec, DOC_VECTORS[i]);
    if (s > bestScore) {
      bestScore = s;
      bestIdx = i;
    }
  }
  return { document: DOCUMENTS[bestIdx], score: bestScore, index: bestIdx };
}

// ---------------------------------------------------------------------------
// Knowledge base — expanded with many more topics
// ---------------------------------------------------------------------------

interface KBEntry {
  keywords: string[];
  patterns: { match: string[]; answer: string }[];
}

const KNOWLEDGE_BASE: KBEntry[] = [
  {
    keywords: ['python'],
    patterns: [
      { match: ['who', 'created'], answer: 'Python was created by Guido van Rossum.' },
      { match: ['who', 'creator'], answer: 'The creator of Python is Guido van Rossum.' },
      { match: ['when', 'release'], answer: 'Python was first released in 1991.' },
      { match: ['when', 'created'], answer: 'Python was created by Guido van Rossum and first released in 1991.' },
      { match: ['what', 'type'], answer: 'Python is a high-level, general-purpose programming language.' },
      { match: ['what'], answer: 'Python is a high-level programming language known for its simple syntax and readability.' },
    ],
  },
  {
    keywords: ['javascript', 'js'],
    patterns: [
      { match: ['who', 'created'], answer: 'JavaScript was created by Brendan Eich.' },
      { match: ['when', 'release'], answer: 'JavaScript was first released in 1995.' },
      { match: ['when', 'created'], answer: 'JavaScript was created by Brendan Eich in 1995.' },
      { match: ['what'], answer: 'JavaScript is a programming language commonly used to create interactive web applications and runs in web browsers.' },
    ],
  },
  {
    keywords: ['java'],
    patterns: [
      { match: ['who', 'created'], answer: 'Java was created by James Gosling at Sun Microsystems.' },
      { match: ['when', 'release'], answer: 'Java was released in 1995.' },
      { match: ['what'], answer: 'Java is a general-purpose programming language designed to have fewer implementation dependencies.' },
    ],
  },
  {
    keywords: ['c++', 'cpp'],
    patterns: [
      { match: ['who', 'created'], answer: 'C++ was created by Bjarne Stroustrup.' },
      { match: ['when', 'release'], answer: 'C++ was released in 1985.' },
      { match: ['what'], answer: 'C++ is an extension of the C programming language that adds object-oriented features.' },
    ],
  },
  {
    keywords: ['c language', 'c programming'],
    patterns: [
      { match: ['who', 'created'], answer: 'C was created by Dennis Ritchie at Bell Labs.' },
      { match: ['when', 'created'], answer: 'C was created in 1972.' },
      { match: ['what'], answer: 'C is a general-purpose programming language widely used for system programming.' },
    ],
  },
  {
    keywords: ['ruby'],
    patterns: [
      { match: ['who', 'created'], answer: 'Ruby was created by Yukihiro Matsumoto.' },
      { match: ['when', 'release'], answer: 'Ruby was first released in 1995.' },
      { match: ['what'], answer: 'Ruby is a programming language focused on simplicity and productivity.' },
    ],
  },
  {
    keywords: ['php'],
    patterns: [
      { match: ['who', 'created'], answer: 'PHP was created by Rasmus Lerdorf.' },
      { match: ['when', 'release'], answer: 'PHP was first released in 1995.' },
      { match: ['what'], answer: 'PHP is a server-side scripting language used for web development.' },
    ],
  },
  {
    keywords: ['swift'],
    patterns: [
      { match: ['who', 'created'], answer: 'Swift was created by Chris Lattner at Apple.' },
      { match: ['when', 'release'], answer: 'Swift was released by Apple in 2014.' },
      { match: ['what'], answer: 'Swift is a programming language used for iOS and macOS application development.' },
    ],
  },
  {
    keywords: ['go', 'golang'],
    patterns: [
      { match: ['who', 'created'], answer: 'Go was created by Robert Griesemer, Rob Pike, and Ken Thompson at Google.' },
      { match: ['when', 'release'], answer: 'Go was released in 2009.' },
      { match: ['what'], answer: 'Go is a statically typed programming language designed for simplicity and efficiency.' },
    ],
  },
  {
    keywords: ['kotlin'],
    patterns: [
      { match: ['who', 'created'], answer: 'Kotlin was created by JetBrains.' },
      { match: ['when', 'release'], answer: 'Kotlin was first released in 2011.' },
      { match: ['what'], answer: 'Kotlin is a programming language that runs on the Java Virtual Machine and is used for Android development.' },
    ],
  },
  {
    keywords: ['typescript'],
    patterns: [
      { match: ['who', 'created'], answer: 'TypeScript was created by Microsoft.' },
      { match: ['when', 'release'], answer: 'TypeScript was first released in 2012.' },
      { match: ['what'], answer: 'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.' },
    ],
  },
  {
    keywords: ['html'],
    patterns: [
      { match: ['full form'], answer: 'HTML stands for HyperText Markup Language.' },
      { match: ['stand'], answer: 'HTML stands for HyperText Markup Language.' },
      { match: ['stands'], answer: 'HTML stands for HyperText Markup Language.' },
      { match: ['who', 'created'], answer: 'HTML was created by Tim Berners-Lee in 1991.' },
      { match: ['used', 'purpose'], answer: 'HTML is used to structure web pages.' },
      { match: ['what'], answer: 'HTML stands for HyperText Markup Language and is used to structure web pages.' },
    ],
  },
  {
    keywords: ['css'],
    patterns: [
      { match: ['full form'], answer: 'CSS stands for Cascading Style Sheets.' },
      { match: ['stand'], answer: 'CSS stands for Cascading Style Sheets.' },
      { match: ['stands'], answer: 'CSS stands for Cascading Style Sheets.' },
      { match: ['who', 'created'], answer: 'CSS was first proposed by Hakon Wium Lie in 1994.' },
      { match: ['used', 'purpose'], answer: 'CSS is used to style web pages.' },
      { match: ['what'], answer: 'CSS stands for Cascading Style Sheets and is used to style web pages.' },
    ],
  },
  {
    keywords: ['react'],
    patterns: [
      { match: ['who', 'created'], answer: 'React was created by Facebook.' },
      { match: ['when', 'release'], answer: 'React was first released in 2013.' },
      { match: ['what'], answer: 'React is a JavaScript library for building user interfaces.' },
    ],
  },
  {
    keywords: ['angular'],
    patterns: [
      { match: ['who', 'created'], answer: 'Angular was created by Google.' },
      { match: ['when', 'release'], answer: 'Angular was first released in 2010.' },
      { match: ['what'], answer: 'Angular is a TypeScript-based web application framework.' },
    ],
  },
  {
    keywords: ['vue'],
    patterns: [
      { match: ['who', 'created'], answer: 'Vue was created by Evan You.' },
      { match: ['when', 'release'], answer: 'Vue was first released in 2014.' },
      { match: ['what'], answer: 'Vue is a JavaScript framework for building user interfaces.' },
    ],
  },
  {
    keywords: ['node', 'nodejs'],
    patterns: [
      { match: ['who', 'created'], answer: 'Node.js was created by Ryan Dahl.' },
      { match: ['when', 'release'], answer: 'Node.js was first released in 2009.' },
      { match: ['what'], answer: 'Node.js is a JavaScript runtime built on the V8 engine.' },
    ],
  },
  {
    keywords: ['tensorflow'],
    patterns: [
      { match: ['who', 'created'], answer: 'TensorFlow was developed by Google.' },
      { match: ['when', 'release'], answer: 'TensorFlow was released in 2015.' },
      { match: ['what'], answer: 'TensorFlow is an open-source machine learning framework.' },
    ],
  },
  {
    keywords: ['pytorch'],
    patterns: [
      { match: ['who', 'created'], answer: 'PyTorch was developed by Facebook.' },
      { match: ['when', 'release'], answer: 'PyTorch was released in 2016.' },
      { match: ['what'], answer: 'PyTorch is an open-source machine learning framework.' },
    ],
  },
  {
    keywords: ['chatgpt', 'gpt'],
    patterns: [
      { match: ['who', 'created'], answer: 'ChatGPT was developed by OpenAI.' },
      { match: ['when', 'release'], answer: 'ChatGPT was released in November 2022.' },
      { match: ['what'], answer: 'ChatGPT is an AI language model developed by OpenAI based on the GPT architecture.' },
    ],
  },
  {
    keywords: ['machine learning', 'ml'],
    patterns: [
      { match: ['what'], answer: 'Machine Learning is a subset of Artificial Intelligence that allows computers to learn patterns from data without being explicitly programmed.' },
    ],
  },
  {
    keywords: ['artificial intelligence', 'ai'],
    patterns: [
      { match: ['what'], answer: 'Artificial Intelligence is a branch of computer science that focuses on creating machines capable of performing tasks that normally require human intelligence.' },
    ],
  },
  {
    keywords: ['natural language processing', 'nlp'],
    patterns: [
      { match: ['what'], answer: 'Natural Language Processing is a field of Artificial Intelligence that enables computers to understand and process human language.' },
    ],
  },
  {
    keywords: ['deep learning'],
    patterns: [
      { match: ['what'], answer: 'Deep Learning is a subset of Machine Learning that uses artificial neural networks with multiple layers.' },
    ],
  },
  {
    keywords: ['computer vision'],
    patterns: [
      { match: ['what'], answer: 'Computer Vision is a field of Artificial Intelligence that trains computers to interpret and understand visual information from images and videos.' },
    ],
  },
  {
    keywords: ['data science'],
    patterns: [
      { match: ['what'], answer: 'Data Science is an interdisciplinary field that uses scientific methods, processes, and algorithms to extract knowledge from data.' },
    ],
  },
  {
    keywords: ['scikit-learn', 'scikit'],
    patterns: [
      { match: ['what'], answer: 'Scikit-learn is a machine learning library for Python.' },
      { match: ['when', 'release'], answer: 'Scikit-learn was initially released in 2010.' },
    ],
  },
  // Capitals
  {
    keywords: ['india'],
    patterns: [
      { match: ['capital'], answer: 'The capital of India is New Delhi.' },
      { match: ['independence'], answer: 'India gained independence on August 15, 1947.' },
      { match: ['first', 'prime'], answer: 'The first Prime Minister of India was Jawaharlal Nehru.' },
      { match: ['where'], answer: 'India is a country in South Asia.' },
    ],
  },
  {
    keywords: ['karnataka'],
    patterns: [
      { match: ['capital'], answer: 'The capital of Karnataka is Bengaluru.' },
    ],
  },
  {
    keywords: ['maharashtra'],
    patterns: [
      { match: ['capital'], answer: 'The capital of Maharashtra is Mumbai.' },
    ],
  },
  {
    keywords: ['tamil nadu'],
    patterns: [
      { match: ['capital'], answer: 'The capital of Tamil Nadu is Chennai.' },
    ],
  },
  {
    keywords: ['west bengal'],
    patterns: [
      { match: ['capital'], answer: 'The capital of West Bengal is Kolkata.' },
    ],
  },
  {
    keywords: ['united states', 'usa', 'america'],
    patterns: [
      { match: ['capital'], answer: 'The capital of the United States is Washington, D.C.' },
      { match: ['how many', 'states'], answer: 'The United States has 50 states.' },
    ],
  },
  {
    keywords: ['united kingdom', 'uk', 'britain'],
    patterns: [
      { match: ['capital'], answer: 'The capital of the United Kingdom is London.' },
      { match: ['what'], answer: 'The United Kingdom consists of England, Scotland, Wales, and Northern Ireland.' },
    ],
  },
  {
    keywords: ['france'],
    patterns: [
      { match: ['capital'], answer: 'The capital of France is Paris.' },
      { match: ['where'], answer: 'France is a country in Western Europe.' },
    ],
  },
  {
    keywords: ['germany'],
    patterns: [
      { match: ['capital'], answer: 'The capital of Germany is Berlin.' },
      { match: ['where'], answer: 'Germany is a country in Central Europe.' },
    ],
  },
  {
    keywords: ['japan'],
    patterns: [
      { match: ['capital'], answer: 'The capital of Japan is Tokyo.' },
      { match: ['where'], answer: 'Japan is an island country in East Asia.' },
    ],
  },
  {
    keywords: ['china'],
    patterns: [
      { match: ['capital'], answer: 'The capital of China is Beijing.' },
      { match: ['where'], answer: 'China is a country in East Asia and the most populous country in the world.' },
    ],
  },
  {
    keywords: ['australia'],
    patterns: [
      { match: ['capital'], answer: 'The capital of Australia is Canberra.' },
      { match: ['where'], answer: 'Australia is a country and continent in the Southern Hemisphere.' },
    ],
  },
  {
    keywords: ['canada'],
    patterns: [
      { match: ['capital'], answer: 'The capital of Canada is Ottawa.' },
    ],
  },
  {
    keywords: ['russia'],
    patterns: [
      { match: ['capital'], answer: 'The capital of Russia is Moscow.' },
      { match: ['largest'], answer: 'Russia is the largest country in the world by area.' },
    ],
  },
  {
    keywords: ['italy'],
    patterns: [
      { match: ['capital'], answer: 'The capital of Italy is Rome.' },
    ],
  },
  {
    keywords: ['spain'],
    patterns: [
      { match: ['capital'], answer: 'The capital of Spain is Madrid.' },
    ],
  },
  {
    keywords: ['brazil'],
    patterns: [
      { match: ['capital'], answer: 'The capital of Brazil is Brasilia.' },
      { match: ['where'], answer: 'Brazil is the largest country in South America.' },
    ],
  },
  {
    keywords: ['egypt'],
    patterns: [
      { match: ['capital'], answer: 'The capital of Egypt is Cairo.' },
    ],
  },
  {
    keywords: ['south korea', 'korea'],
    patterns: [
      { match: ['capital'], answer: 'The capital of South Korea is Seoul.' },
    ],
  },
  // Science
  {
    keywords: ['water'],
    patterns: [
      { match: ['chemical', 'formula'], answer: 'The chemical formula of water is H2O.' },
      { match: ['composed', 'made'], answer: 'Water is composed of two hydrogen atoms and one oxygen atom.' },
      { match: ['what'], answer: 'Water is composed of two hydrogen atoms and one oxygen atom, with the chemical formula H2O.' },
    ],
  },
  {
    keywords: ['speed of light', 'light speed'],
    patterns: [
      { match: ['what', 'how fast'], answer: 'The speed of light in a vacuum is approximately 299,792 kilometers per second.' },
    ],
  },
  {
    keywords: ['gravity'],
    patterns: [
      { match: ['who', 'discovered'], answer: 'The theory of gravity was developed by Isaac Newton and later refined by Albert Einstein.' },
      { match: ['what'], answer: 'Gravity is a force that attracts objects toward each other.' },
    ],
  },
  {
    keywords: ['earth'],
    patterns: [
      { match: ['what'], answer: 'The Earth is the third planet from the Sun in the Solar System.' },
      { match: ['how many', 'moon'], answer: 'The Earth has one natural satellite, the Moon.' },
    ],
  },
  {
    keywords: ['sun'],
    patterns: [
      { match: ['what'], answer: 'The Sun is a star at the center of the Solar System.' },
      { match: ['how old'], answer: 'The Sun is approximately 4.6 billion years old.' },
    ],
  },
  {
    keywords: ['dna'],
    patterns: [
      { match: ['full form'], answer: 'DNA stands for Deoxyribonucleic Acid.' },
      { match: ['stand'], answer: 'DNA stands for Deoxyribonucleic Acid.' },
      { match: ['stand'], answer: 'DNA stands for Deoxyribonucleic Acid.' },
      { match: ['stands'], answer: 'DNA stands for Deoxyribonucleic Acid.' },
      { match: ['what'], answer: 'DNA carries the genetic instructions for the development and functioning of living organisms.' },
    ],
  },
  {
    keywords: ['photosynthesis'],
    patterns: [
      { match: ['what'], answer: 'Photosynthesis is the process by which plants convert sunlight, water, and carbon dioxide into oxygen and sugar.' },
    ],
  },
  {
    keywords: ['periodic table'],
    patterns: [
      { match: ['who', 'created'], answer: 'The periodic table was created by Dmitri Mendeleev in 1869.' },
      { match: ['what'], answer: 'The periodic table is a tabular arrangement of chemical elements organized by their atomic number.' },
    ],
  },
  {
    keywords: ['oxygen'],
    patterns: [
      { match: ['atomic number'], answer: 'Oxygen has an atomic number of 8.' },
      { match: ['symbol'], answer: 'The chemical symbol for oxygen is O.' },
      { match: ['what'], answer: 'Oxygen is a chemical element with the symbol O and atomic number 8. It is essential for respiration in living organisms.' },
    ],
  },
  {
    keywords: ['carbon dioxide', 'co2'],
    patterns: [
      { match: ['what'], answer: 'Carbon dioxide is a greenhouse gas with the chemical formula CO2. It is produced by respiration and combustion.' },
    ],
  },
  // History
  {
    keywords: ['world war i', 'world war 1', 'ww1', 'first world war', 'world war one'],
    patterns: [
      { match: ['when', 'start'], answer: 'World War I began in 1914.' },
      { match: ['when', 'end'], answer: 'World War I ended in 1918.' },
      { match: ['what'], answer: 'World War I was fought between the Allied Powers and the Central Powers from 1914 to 1918.' },
    ],
  },
  {
    keywords: ['world war ii', 'world war 2', 'ww2', 'second world war', 'world war two'],
    patterns: [
      { match: ['when', 'start'], answer: 'World War II began in 1939.' },
      { match: ['when', 'end'], answer: 'World War II ended in 1945.' },
      { match: ['what'], answer: 'World War II was fought between the Allied Powers and the Axis Powers from 1939 to 1945.' },
    ],
  },
  {
    keywords: ['gandhi', 'mahatma'],
    patterns: [
      { match: ['when', 'born'], answer: 'Mahatma Gandhi was born on October 2, 1869.' },
      { match: ['who'], answer: 'Mahatma Gandhi led the Indian independence movement through nonviolent civil disobedience.' },
    ],
  },
  {
    keywords: ['einstein'],
    patterns: [
      { match: ['when', 'born'], answer: 'Albert Einstein was born in 1879.' },
      { match: ['when', 'died'], answer: 'Albert Einstein died in 1955.' },
      { match: ['what'], answer: 'Albert Einstein developed the theory of relativity and the famous equation E=mc2.' },
    ],
  },
  {
    keywords: ['newton'],
    patterns: [
      { match: ['when', 'born'], answer: 'Isaac Newton was born in 1642.' },
      { match: ['when', 'died'], answer: 'Isaac Newton died in 1727.' },
      { match: ['what'], answer: 'Isaac Newton formulated the laws of motion and universal gravitation.' },
    ],
  },
  {
    keywords: ['darwin'],
    patterns: [
      { match: ['when', 'born'], answer: 'Charles Darwin was born in 1809.' },
      { match: ['what'], answer: 'Charles Darwin developed the theory of evolution by natural selection.' },
    ],
  },
  {
    keywords: ['taj mahal'],
    patterns: [
      { match: ['who', 'built'], answer: 'The Taj Mahal was built by Mughal Emperor Shah Jahan in memory of his wife Mumtaz Mahal.' },
      { match: ['where'], answer: 'The Taj Mahal is located in Agra, India.' },
    ],
  },
  {
    keywords: ['great wall of china', 'great wall'],
    patterns: [
      { match: ['how long'], answer: 'The Great Wall of China is approximately 21,196 kilometers long.' },
      { match: ['what'], answer: 'The Great Wall of China was built over many centuries to protect against invasions.' },
    ],
  },
  // Technology
  {
    keywords: ['internet'],
    patterns: [
      { match: ['what'], answer: 'The Internet is a global network of interconnected computers that communicate using standardized protocols.' },
      { match: ['when', 'created'], answer: 'The Internet was developed from ARPANET in the late 1960s.' },
    ],
  },
  {
    keywords: ['world wide web', 'www'],
    patterns: [
      { match: ['who', 'invented'], answer: 'The World Wide Web was invented by Tim Berners-Lee in 1989.' },
      { match: ['what'], answer: 'The World Wide Web is an information system that operates over the Internet.' },
    ],
  },
  {
    keywords: ['http'],
    patterns: [
      { match: ['full form'], answer: 'HTTP stands for HyperText Transfer Protocol.' },
      { match: ['stand'], answer: 'HTTP stands for HyperText Transfer Protocol.' },
      { match: ['stands'], answer: 'HTTP stands for HyperText Transfer Protocol.' },
      { match: ['what'], answer: 'HTTP is the protocol used for transmitting data over the World Wide Web.' },
    ],
  },
  {
    keywords: ['https'],
    patterns: [
      { match: ['full form'], answer: 'HTTPS stands for HyperText Transfer Protocol Secure.' },
      { match: ['stand'], answer: 'HTTPS stands for HyperText Transfer Protocol Secure.' },
      { match: ['stands'], answer: 'HTTPS stands for HyperText Transfer Protocol Secure.' },
      { match: ['what'], answer: 'HTTPS uses encryption to secure data transmitted over the Internet.' },
    ],
  },
  {
    keywords: ['tcp'],
    patterns: [
      { match: ['full form'], answer: 'TCP stands for Transmission Control Protocol.' },
      { match: ['stand'], answer: 'TCP stands for Transmission Control Protocol.' },
      { match: ['stands'], answer: 'TCP stands for Transmission Control Protocol.' },
      { match: ['what'], answer: 'TCP is one of the main protocols used on the Internet for reliable data transmission.' },
    ],
  },
  {
    keywords: ['ip', 'internet protocol'],
    patterns: [
      { match: ['full form'], answer: 'IP stands for Internet Protocol.' },
      { match: ['stand'], answer: 'IP stands for Internet Protocol.' },
      { match: ['stands'], answer: 'IP stands for Internet Protocol.' },
      { match: ['what'], answer: 'IP is responsible for addressing and routing packets between computers on a network.' },
    ],
  },
  {
    keywords: ['sql'],
    patterns: [
      { match: ['full form'], answer: 'SQL stands for Structured Query Language.' },
      { match: ['stand'], answer: 'SQL stands for Structured Query Language.' },
      { match: ['stands'], answer: 'SQL stands for Structured Query Language.' },
      { match: ['what'], answer: 'SQL is used to manage and manipulate relational databases.' },
    ],
  },
  {
    keywords: ['linux'],
    patterns: [
      { match: ['who', 'created'], answer: 'Linux was created by Linus Torvalds.' },
      { match: ['when', 'created'], answer: 'Linux was created in 1991.' },
      { match: ['what'], answer: 'Linux is an open-source operating system kernel widely used in servers and embedded systems.' },
    ],
  },
  {
    keywords: ['android'],
    patterns: [
      { match: ['who', 'created'], answer: 'Android was developed by Google.' },
      { match: ['when', 'release'], answer: 'Android was first released in 2008.' },
      { match: ['what'], answer: 'Android is a mobile operating system based on the Linux kernel.' },
    ],
  },
  {
    keywords: ['ios'],
    patterns: [
      { match: ['who', 'created'], answer: 'iOS was developed by Apple.' },
      { match: ['when', 'release'], answer: 'iOS was first released in 2007 with the original iPhone.' },
      { match: ['what'], answer: 'iOS is a mobile operating system developed by Apple.' },
    ],
  },
  {
    keywords: ['cloud computing', 'cloud'],
    patterns: [
      { match: ['what'], answer: 'Cloud computing is the delivery of computing services over the Internet, including servers, storage, databases, and software.' },
    ],
  },
  {
    keywords: ['blockchain'],
    patterns: [
      { match: ['what'], answer: 'Blockchain is a distributed ledger technology that records transactions across many computers.' },
      { match: ['who', 'created'], answer: 'Blockchain was introduced by Satoshi Nakamoto in 2008.' },
    ],
  },
  {
    keywords: ['bitcoin'],
    patterns: [
      { match: ['who', 'created'], answer: 'Bitcoin was created by Satoshi Nakamoto in 2009.' },
      { match: ['what'], answer: 'Bitcoin was the first decentralized cryptocurrency.' },
    ],
  },
  {
    keywords: ['5g'],
    patterns: [
      { match: ['what'], answer: '5G is the fifth generation of mobile network technology, offering faster data speeds and lower latency than 4G.' },
    ],
  },
  // Math
  {
    keywords: ['pi'],
    patterns: [
      { match: ['what', 'value'], answer: 'Pi is approximately equal to 3.14159.' },
      { match: ['what'], answer: 'Pi is a mathematical constant that is the ratio of a circle circumference to its diameter, approximately equal to 3.14159.' },
    ],
  },
  {
    keywords: ['fibonacci'],
    patterns: [
      { match: ['what'], answer: 'The Fibonacci sequence is a series of numbers where each number is the sum of the two preceding ones, starting with 0 and 1.' },
    ],
  },
  {
    keywords: ['prime number', 'prime'],
    patterns: [
      { match: ['what'], answer: 'A prime number is a natural number greater than 1 that has no positive divisors other than 1 and itself. The first prime numbers are 2, 3, 5, 7, 11, and 13.' },
    ],
  },
  {
    keywords: ['pythagorean', 'pythagoras'],
    patterns: [
      { match: ['what'], answer: 'The Pythagorean theorem states that in a right triangle, the square of the hypotenuse equals the sum of the squares of the other two sides.' },
    ],
  },
  // Space
  {
    keywords: ['solar system'],
    patterns: [
      { match: ['how many', 'planets'], answer: 'The Solar System has eight planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.' },
      { match: ['what'], answer: 'The Solar System consists of the Sun and eight planets.' },
    ],
  },
  {
    keywords: ['milky way'],
    patterns: [
      { match: ['what'], answer: 'The Milky Way is the galaxy that contains the Solar System. It is a spiral galaxy with approximately 100 billion stars.' },
    ],
  },
  {
    keywords: ['black hole'],
    patterns: [
      { match: ['what'], answer: 'A black hole is a region of spacetime where gravity is so strong that nothing can escape from it. Black holes are formed from collapsed stars.' },
    ],
  },
  {
    keywords: ['moon'],
    patterns: [
      { match: ['what'], answer: 'The Moon is the natural satellite of the Earth.' },
      { match: ['how far', 'distance'], answer: 'The Moon orbits the Earth at an average distance of 384,400 kilometers.' },
    ],
  },
  {
    keywords: ['mars'],
    patterns: [
      { match: ['what'], answer: 'Mars is the fourth planet from the Sun, often called the Red Planet due to its reddish appearance from iron oxide.' },
    ],
  },
  {
    keywords: ['jupiter'],
    patterns: [
      { match: ['what'], answer: 'Jupiter is the largest planet in the Solar System. It is a gas giant with a famous feature called the Great Red Spot.' },
    ],
  },
  {
    keywords: ['saturn'],
    patterns: [
      { match: ['what'], answer: 'Saturn is the sixth planet from the Sun, known for its prominent ring system made of ice and rock particles.' },
    ],
  },
  // Health & Biology
  {
    keywords: ['human brain', 'brain'],
    patterns: [
      { match: ['what'], answer: 'The human brain is the central organ of the human nervous system, weighing approximately 1.4 kilograms.' },
    ],
  },
  {
    keywords: ['human heart', 'heart'],
    patterns: [
      { match: ['how many', 'chambers'], answer: 'The human heart has four chambers.' },
      { match: ['what'], answer: 'The human heart pumps blood throughout the body, beating approximately 72 times per minute.' },
    ],
  },
  {
    keywords: ['protein'],
    patterns: [
      { match: ['what'], answer: 'Proteins are essential nutrients made up of amino acids, important for building muscles and tissues.' },
    ],
  },
  {
    keywords: ['vitamin', 'vitamins'],
    patterns: [
      { match: ['what'], answer: 'Vitamins are organic compounds required in small amounts for proper body function. Vitamin C is important for immune system support.' },
    ],
  },
  {
    keywords: ['blood'],
    patterns: [
      { match: ['what'], answer: 'Blood is composed of red blood cells, white blood cells, platelets, and plasma. There are four main blood types: A, B, AB, and O.' },
    ],
  },
  // Economics
  {
    keywords: ['gdp'],
    patterns: [
      { match: ['full form'], answer: 'GDP stands for Gross Domestic Product.' },
      { match: ['stand'], answer: 'GDP stands for Gross Domestic Product.' },
      { match: ['stands'], answer: 'GDP stands for Gross Domestic Product.' },
      { match: ['what'], answer: 'GDP measures the total value of goods and services produced in a country.' },
    ],
  },
  {
    keywords: ['inflation'],
    patterns: [
      { match: ['what'], answer: 'Inflation is the rate at which the general level of prices for goods and services rises, reducing the purchasing power of money.' },
    ],
  },
  {
    keywords: ['stock market', 'stock exchange'],
    patterns: [
      { match: ['what'], answer: 'A stock market is a marketplace where shares of publicly traded companies are bought and sold. The largest stock exchange is the New York Stock Exchange.' },
    ],
  },
];

function knowledgeBaseAnswer(question: string): string | null {
  const q = question.toLowerCase();

  // Sort entries by longest keyword first so 'world war ii' matches before 'world war i'
  const sortedEntries = [...KNOWLEDGE_BASE].sort((a, b) => {
    const aMax = Math.max(...a.keywords.map((k) => k.length));
    const bMax = Math.max(...b.keywords.map((k) => k.length));
    return bMax - aMax;
  });

  for (const entry of sortedEntries) {
    const matched = entry.keywords.some((kw) => {
      if (kw.length <= 4) {
        const idx = q.indexOf(kw);
        if (idx === -1) return false;
        const before = idx > 0 ? q[idx - 1] : ' ';
        const after = idx + kw.length < q.length ? q[idx + kw.length] : ' ';
        return !/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after);
      }
      return q.includes(kw);
    });
    if (!matched) continue;

    let bestPattern: { match: string[]; answer: string } | null = null;
    let bestMatchCount = 0;

    for (const pattern of entry.patterns) {
      const matchCount = pattern.match.filter((m) => q.includes(m)).length;
      if (matchCount === pattern.match.length && matchCount > bestMatchCount) {
        bestPattern = pattern;
        bestMatchCount = matchCount;
      }
    }

    if (bestPattern) return bestPattern.answer;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Dialogue manager
// ---------------------------------------------------------------------------

function dialogueManager(question: string): string | null {
  const q = question.toLowerCase().trim();
  const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'yo', 'sup'];
  if (greetings.includes(q)) return 'Hello! How can I help you?';
  if (q.includes('thank')) return "You're welcome!";
  if (['bye', 'goodbye', 'see you', 'see ya', 'later'].includes(q)) return 'Goodbye!';
  if (q.includes('how are you')) return "I'm doing well, thanks for asking! How can I help you?";
  if (q.includes('your name') || q.includes("what's your name")) return "I'm the Hybrid QA Chatbot. Ask me anything!";
  if (q.includes('what can you do') || q.includes('help')) return "I can answer questions about programming, AI, geography, science, history, technology, math, space, and more. Try asking me something!";
  return null;
}

// ---------------------------------------------------------------------------
// Answer extraction (lightweight stand-in for spaCy NER)
// ---------------------------------------------------------------------------

function extractAnswer(question: string, document: string): string {
  const q = question.toLowerCase();

  const sentences = document.match(/[^.!?]+[.!?]+/g) || [document];

  if (q.startsWith('who')) {
    // Find capitalized person-like names (consecutive Capitalized words, not sentence-initial).
    const nameMatches = document.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g);
    if (nameMatches && nameMatches.length > 0) return nameMatches[0];
    const singleCaps = document.match(/\b([A-Z][a-z]+)\b/g);
    if (singleCaps) {
      const firstWord = document.trim().split(/\s+/)[0];
      const filtered = singleCaps.filter((w) => w !== firstWord);
      if (filtered.length > 0) return filtered[0];
    }
  }

  if (q.startsWith('when')) {
    const yearMatch = document.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) return yearMatch[0];
    const dateMatch = document.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,?\s+\d{4})?\b/);
    if (dateMatch) return dateMatch[0];
  }

  if (q.startsWith('where')) {
    const placeMatch = document.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g);
    if (placeMatch) return placeMatch[0];
  }

  if (q.startsWith('how many')) {
    const numberMatch = document.match(/\b(\d+)\b/);
    if (numberMatch) return numberMatch[0];
  }

  // For "what is" questions, return the most relevant sentence
  if (q.startsWith('what')) {
    // Return the sentence that has the most overlap with the question
    const qTokens = new Set(tokenize(q));
    let bestSentence = sentences[0].trim();
    let bestOverlap = 0;
    for (const s of sentences) {
      const sTokens = tokenize(s);
      const overlap = sTokens.filter((t) => qTokens.has(t)).length;
      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        bestSentence = s.trim();
      }
    }
    return bestSentence;
  }

  return sentences[0].trim();
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export function answerQuestion(question: string): QAResult {
  const dialogue = dialogueManager(question);
  if (dialogue) return { answer: dialogue, source: 'Dialogue Manager', confidence: 1.0 };

  const kb = knowledgeBaseAnswer(question);
  if (kb) return { answer: kb, source: 'Knowledge Base', confidence: 1.0 };

  const { document: doc, score } = retrieveDocument(question);

  if (score < 0.05) {
    return { answer: "I'm sorry, I don't have enough information to answer that question. Try asking about programming, AI, geography, science, history, technology, math, or space.", source: 'No Answer', confidence: score };
  }

  const answer = extractAnswer(question, doc);
  return { answer, source: 'IR + spaCy', confidence: score };
}

export const SUGGESTED_QUESTIONS = [
  'Who created Python?',
  'What is machine learning?',
  'What is the capital of Japan?',
  'What is the full form of HTML?',
  'Who invented the World Wide Web?',
  'What is the speed of light?',
  'How many planets are in the Solar System?',
  'When did World War II end?',
  'What is a black hole?',
  'What does DNA stand for?',
  'What is cloud computing?',
  'Who created Bitcoin?',
];
