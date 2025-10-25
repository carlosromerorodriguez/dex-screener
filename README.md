# MINOTAURION ⚡ — Unleash the Beast of the Market

The next-generation DEX Screener for Memecoins.  
Built on Moralis APIs + React + Tailwind CSS.

> **Only the Brave Trade Here**

## ⚡ Features

- 🚀 **Real-time Memecoin Data** - Powered by Moralis API
- 📈 **Trending Tokens** - Track the hottest tokens across multiple blockchains
- 🔍 **Token Deep Dive** - Comprehensive token information with price charts and transactions
- 💼 **Portfolio Tracking** - Monitor your crypto holdings in one place
- 🎯 **Pump.fun Integration** - Discover new tokens from the Pump.fun ecosystem
- 🔎 **Advanced Search** - Find tokens by name, symbol, or contract address
- ⛓️ **Multi-Chain Support** - Ethereum, BSC, Polygon, Solana, Arbitrum, Base, and more

## 🛠️ Tech Stack

- **React** - Frontend framework
- **React Router** - Client-side routing
- **Tailwind CSS** - Modern utility-first CSS framework
- **Chart.js** - Interactive data visualization
- **Moralis API** - Blockchain data provider
- **Recharts** - Additional charting library

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── layout/          # Layout components (sidebar, topbar)
│   ├── token/           # Token-specific components
│   ├── trending/        # Trending page components
│   ├── portfolio/       # Portfolio tracking components
│   ├── pumpfun/         # Pump.fun integration components
│   └── modals/          # Modal components (search, filters)
├── pages/               # Page components
├── services/            # API services and utilities
├── utils/               # Helper functions and formatters
├── App.js               # Main application component
└── index.js             # Application entry point
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Moralis API key ([Get one here](https://developers.moralis.com))

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/minotaurion/minotaurion.git
   cd minotaurion
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Create a `.env` file** in the root directory and add your Moralis API key:

   ```env
   REACT_APP_MORALIS_API_KEY=your_api_key_here
   ```

4. **Start the development server:**

   ```bash
   npm start
   ```

5. **Open your browser** and navigate to [http://localhost:3000](http://localhost:3000)

## 🎨 Theming

MINOTAURION uses a custom dark theme with golden accents:

```css
:root {
  --color-bg-primary: #090b12;
  --color-bg-secondary: #10131a;
  --color-bg-tertiary: #161b24;
  --color-accent: #c29b43;        /* Dorado Minotaurion */
  --color-text-primary: #ffffff;
  --color-text-secondary: #9aa0b2;
  --color-text-highlight: #f0d17a;
  --color-green: #3fff9a;
  --color-red: #ff4b4b;
}
```

## 🔗 Moralis APIs Used

This project leverages multiple Moralis APIs:

### Token Data APIs
- **Trending Tokens** - `GET /tokens/trending`
- **Token Search** - `GET /tokens/search`
- **Token Metadata (EVM)** - `GET /erc20/metadata`
- **Token Metadata (Solana)** - `GET /token/mainnet/{tokenAddress}/metadata`

### Pair/Liquidity Pool APIs
- **Token Pairs (EVM)** - `GET /erc20/{tokenAddress}/pairs`
- **Token Pairs (Solana)** - `GET /token/mainnet/{tokenAddress}/pairs`
- **Pair Stats** - `GET /pairs/{pairAddress}/stats`
- **Pair Swaps** - `GET /pairs/{pairAddress}/swaps`
- **Pair Snipers** - `GET /pairs/{pairAddress}/snipers`

### Token Holder APIs
- **Token Holders** - `GET /erc20/{tokenAddress}/holders`
- **Token Holder Stats** - `GET /erc20/{tokenAddress}/holder-stats`

### Wallet/Portfolio APIs
- **Wallet Net Worth** - `GET /wallets/{address}/net-worth`
- **Wallet Tokens** - `GET /wallets/{address}/tokens`

### Pump.fun (Solana) APIs
- **New Tokens** - `GET /token/mainnet/exchange/pumpfun/new`
- **Bonding Tokens** - `GET /token/mainnet/exchange/pumpfun/bonding`
- **Graduated Tokens** - `GET /token/mainnet/exchange/pumpfun/graduated`

## ⛓️ Supported Blockchains

| Chain     | Chain ID | Explorer                                                |
| --------- | -------- | ------------------------------------------------------- |
| Ethereum  | 0x1      | [Etherscan](https://etherscan.io)                       |
| BSC       | 0x38     | [BscScan](https://bscscan.com)                          |
| Polygon   | 0x89     | [PolygonScan](https://polygonscan.com)                  |
| Arbitrum  | 0xa4b1   | [Arbiscan](https://arbiscan.io)                         |
| Optimism  | 0xa      | [Optimistic Etherscan](https://optimistic.etherscan.io) |
| Base      | 0x2105   | [BaseScan](https://basescan.org)                        |
| Avalanche | 0xa86a   | [Snowtrace](https://snowtrace.io)                       |
| Solana    | solana   | [Solscan](https://solscan.io)                           |
| Fantom    | 0xfa     | [FTMScan](https://ftmscan.com)                          |
| Pulse     | 0x171    | [PulseScan](https://scan.pulsechain.com)                |
| Ronin     | 0x7e4    | [Ronin Explorer](https://app.roninchain.com)            |
| Linea     | 0xe708   | [LineaScan](https://lineascan.build)                    |

## 📜 Scripts

```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
npm run eject      # Eject from Create React App (irreversible)
```

## 📚 Resources

- [Moralis Web3 API Documentation](https://docs.moralis.com/web3-data-api/evm/reference)
- [Moralis Solana API Documentation](https://docs.moralis.com/web3-data-api/solana/reference)
- [React Documentation](https://react.dev/learn)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)

## 📄 License

MIT — © 2025 Team Minotaurion

---

**Built with ⚡ by the MINOTAURION Team**
