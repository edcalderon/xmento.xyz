const { createPublicClient, http } = require('viem');
const { celoAlfajores } = require('viem/chains');

// Celo Alfajores public RPC URL
const RPC_URL = 'https://alfajores-forno.celo-testnet.org';

// Factory contract address on Alfajores
const FACTORY_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

// ABI for the functions we want to call
const FACTORY_ABI = [
  {
    "inputs": [],
    "name": "vaultImplementation",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getVaultAddress",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getVaultCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "cUSD",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "cEUR",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "cREAL",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "dex",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "yieldOracle",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function checkFactory() {
  // Create a public client
  const client = createPublicClient({
    chain: celoAlfajores,
    transport: http(RPC_URL),
  });

  console.log('Checking factory contract at:', FACTORY_ADDRESS);

  try {
    // Check vault implementation
    const vaultImpl = await client.readContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: 'vaultImplementation',
    });
    console.log('Vault implementation:', vaultImpl);

    // Check token addresses
    const [cUSD, cEUR, cREAL, dex, yieldOracle] = await Promise.all([
      client.readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'cUSD',
      }),
      client.readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'cEUR',
      }),
      client.readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'cREAL',
      }),
      client.readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'dex',
      }),
      client.readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'yieldOracle',
      }),
    ]);

    console.log('cUSD:', cUSD);
    console.log('cEUR:', cEUR);
    console.log('cREAL:', cREAL);
    console.log('DEX:', dex);
    console.log('Yield Oracle:', yieldOracle);

    // Check vault count
    const vaultCount = await client.readContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: 'getVaultCount',
    });
    console.log('Total vaults created:', Number(vaultCount));

  } catch (error) {
    console.error('Error checking factory contract:');
    console.error(error);
  }
}

checkFactory();
