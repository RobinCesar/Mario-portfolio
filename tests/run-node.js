import { run } from './harness.js';
import './all.js';
import './node-only.js';

const failures = await run((message) => console.log(message));
process.exit(failures === 0 ? 0 : 1);
