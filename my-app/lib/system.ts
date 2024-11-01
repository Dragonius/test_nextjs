import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

function getCpuUsage() {
  const cpus = os.cpus();
  return cpus.map((cpu) => {
    const total = Object.values(cpu.times).reduce((acc, tv) => acc + tv, 0);
    const usage = 100 - (100 * cpu.times.idle) / total;
    return usage.toFixed(1);
  });
}

async function getCpuTemp() {
  const { stdout } = await execAsync('sensors -A');
  const match = stdout.match(/Core 0:\s+\+([0-9.]+)°C/);
  if (match && match[1]) {
    return parseFloat(match[1]);
  } else {
    throw new Error("Couldn't parse temperature from output");
  }
}
async function getAcpiTemp() {
  const { stdout } = await execAsync('sensors -A');
  const match = stdout.match(/temp1:\s+\+([0-9.]+)°C/);
  if (match && match[1]) {
    return parseFloat(match[1]);
  } else {
    throw new Error("Couldn't parse temperature from output");
  }
}


function bytesToGB(bytes: number) {
  return (bytes / (1024 * 1024 * 1024)).toFixed(2);
}

export async function getSystemDetails() {
  // Get CPU usage
  const cpuUsage = getCpuUsage();
  
  // Get memory info
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  const cpuTemp = await getCpuTemp();
  const acpiTemp = await getAcpiTemp();
 
  return {
    os,
    cpuTemp,
    acpiTemp,
    cpuUsage,
    memoryUsage: {
      total: parseFloat(bytesToGB(totalMem)),
      used: parseFloat(bytesToGB(usedMem)),
      free: parseFloat(bytesToGB(freeMem)),
    },
  };
}

let systemDetails = {};

function updateSystemDetails() {
  getSystemDetails().then(details => {
    systemDetails = details;
    // Here you can perform any other actions with the system details, e.g., update a UI
  }).catch(err => {
    console.error(err);
  });
}

// Update system details every 5 seconds
setInterval(updateSystemDetails, 5000);

// Initial call to get details immediately
updateSystemDetails();
