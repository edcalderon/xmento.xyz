<h1 align="center">🌐 Xmento.xyz</h1>
<p align="center">
  <b>Decentralized FX Vault Optimizer on Celo using Mento Protocol</b><br/>
  <i>Earn yield on your stablecoins with automated rebalancing and NFT-backed vault positions</i>
</p>

<p align="center">
  <img src="https://xmento.xyz/logo.svg" width="200" alt="Xmento logo"/>
</p>

---

<h2>🚀 Features</h2>

<ul>
  <li><strong>🧠 Smart Auto-Balancing:</strong> Algorithmically rebalance across Mento stable assets to optimize returns.</li>
  <li><strong>🎯 Yield Optimization:</strong> Real-time APY data from DeFi protocols like Moola and stcUSD.</li>
  <li><strong>💎 NFT Vault Positions:</strong> Tokenize your diversified FX portfolio as an ERC721 NFT.</li>
  <li><strong>🔐 Fully Onchain & Trustless:</strong> Non-custodial architecture with full control to the user.</li>
  <li><strong>📊 Real-Time Vault Analytics:</strong> Transparent TVL, APY, and per-user balance views.</li>
</ul>

---

<h2>📦 Vault Interface Overview</h2>

<h4><code>Xmento Vault</code></h4>
<p><i>Earn yield on your stablecoins with automated rebalancing</i></p>

<table>
  <tr><td><b>Total Value Locked:</b></td><td><code>Loading...</code></td></tr>
  <tr><td><b>Your Balance:</b></td><td><code>0.00</code></td></tr>
</table>

<b>How it works:</b>
                        ┌────────────────────┐
                        │    Frontend (Dapp) │
                        └────────┬───────────┘
                                 │
                        Calls mint/deposit/redeem
                                 │
            ┌────────────────────▼────────────────────┐
            │              XmentoVault.sol            │
            │------------------------------------------│
            │ - Accepts stablecoin deposits            │
            │ - Gets optimal APY allocation            │
            │ - Mints NFT to user                      │
            │ - Stores diversified position            │
            │ - Allows rebalance + redeem              │
            └──────────┬─────────────┬─────────────────┘
                       │             │
             ┌─────────▼──┐   ┌──────▼────────┐
             │ YieldOracle│   │     DEX       │
             └────────────┘   │ (for swaps)   │
                             └────────────────┘

        📊 YieldOracle: off-chain bot updates APYs (e.g. cUSD = 4%)
        🔁 Rebalance swaps can be executed manually or with keeper
        🧾 NFT metadata can be shown in frontend to reflect position

<ol>
  <li><b>Deposit:</b> Add cUSD, cEUR, or cREAL to your vault.</li>
  <li><b>Earn:</b> Earn optimized yield via periodic rebalancing.</li>
  <li><b>Withdraw:</b> Exit your position at any time, gas-efficiently.</li>
</ol>


---

<h2>📈 Smart Contract Architecture</h2>

<pre>
├── XmentoVault.sol      → Core contract for deposits, yield routing, withdrawals
├── AutoBalancer.sol     → Monitors onchain & oracle APY and rebalances assets
├── PositionNFT.sol      → ERC721 contract representing user's vault position
</pre>

<b>Supported Stablecoins:</b>
<ul>
  <li>✅ cUSD</li>
  <li>✅ cEUR</li>
  <li>✅ cREAL</li>
  <li>🔜 cCOP (Colombian Peso)</li>
</ul>

---

<h2>🧪 Local Development</h2>

<pre>
npm install
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.js --network alfajores
</pre>

<h4>🔗 Live Demo</h4>
<p><a href="https://xmento.xyz" target="_blank"><strong>xmento.xyz</strong></a></p>

---

<h2>🏁 Submission: Mento Protocol FX Challenge</h2>

<p>
<b>Track:</b> <i>Foreign Exchange (FX) onchain using Mento stablecoins</i><br/>
<b>Challenge:</b> Build scalable, composable FX infra with real yield on Mento assets
</p>

<ul>
  <li>🧮 Aggregates APY data from Celo DeFi yield sources</li>
  <li>📈 Auto-balances positions into higher-yield stables</li>
  <li>🧾 Represents ownership via tradable NFTs</li>
  <li>🌐 Designed for DAOs, treasuries, and DeFi users</li>
</ul>

---

<h2>🔮 Roadmap</h2>

<ul>
  <li>✅ MVP Vault with NFT Positioning</li>
  <li>✅ Simulated AutoBalancer</li>
  <li>🔄 Integration with live Mento FX DEX</li>
  <li>🚀 Mainnet Launch</li>
  <li>🗳 DAO Governance over Vault Strategies</li>
</ul>

---

<h2>🛠 Tech Stack</h2>

<table>
  <tr><td>🔷 Solidity + Hardhat</td><td>🏗 Smart Contract Dev</td></tr>
  <tr><td>🌿 Celo Blockchain</td><td>🔗 EVM-compatible L1</td></tr>
  <tr><td>🪙 OpenZeppelin</td><td>💼 ERC20 + NFT contracts</td></tr>
  <tr><td>📊 The Graph</td><td>📈 Vault analytics and dashboards</td></tr>
  <tr><td>⚛ React + Viem</td><td>🧩 Frontend and wallet integration</td></tr>
</table>

---

<h2>👤 Team</h2>

<ul>
  <li><strong>Edward Calderón</strong> — Founder & Smart Contract Architect</li>
  <li>🌐 <a href="https://linkedin.com/in/edwardcalderon">LinkedIn</a></li>
</ul>

---

<h2>📝 License</h2>

<p><code>MIT License © 2025 Xmento Labs</code></p>
