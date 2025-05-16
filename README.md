# 🌟 DreamStarter Collab - Crowdfunding DeFi Protocol on Sui

DreamStarter Collab is a milestone-based crowdfunding smart contract built on the Sui blockchain using Move. It allows project creators to raise funds from the community, stake collateral, and release funds only upon verified progress — while contributors receive NFTs and can claim refunds in failed campaigns.

## 🚀 Features

- ✅ **Decentralized Crowdfunding** with goal-based contributions
- 🧱 **Milestone-based Fund Release** controlled via audits and on-chain validations
- 🔒 **Creator Stake Commitment** (20% of goal) to reduce rug pull risk
- 🎟️ **NFT Minting** for each contribution (acts as proof and refund right)
- 💰 **Refunds** available if campaign fails or milestones are unmet
- 🛠️ **Admin Validation Layer** for trustless fund control

## 📦 Module Summary

| Object | Purpose |
|--------|---------|
| `State` | Main contract state per proposal |
| `MileStoneInfo` | Tracks milestone progress & audit reports |
| `DreamStarterCollab_NFT` | NFT receipt with refund capability |
| `AdminCap` | Admin control token for validation & special withdrawals |

## 🛠️ Entry Functions

- `initialize(...)` – Create a new crowdfunding proposal
- `stake(...)` – Project creator stakes 20% of the target amount
- `mint_and_contribute(...)` – Contribute and mint a supporter NFT
- `submit_milestone_info(...)` – Add milestone reports & expected funding
- `validate(...)` – Admin validates success/failure
- `withdraw_funds(...)` – Project creator withdraws funds after milestone validation
- `claimback(...)` – NFT holders can claim refund on failed proposals
- `unstake(...)` – Creator retrieves stake if project succeeds
- `admin_withdraw(...)` – Admin emergency withdrawal if rejected but milestones reached

## ⚠️ Error Codes

- `EInsufficientFunds`
- `ENotActiveProposal`
- `ENotProposalCreator`
- `ENotValidCall`
- `EAlreadyFundingReached`
- `ENotStaked`
- `ENotUnpaused`

## 🧪 Security Measures

- Creator staking requirement
- Funding goal & time lock enforcement
- Milestone-based fund access
- AdminCap-controlled validation
- Refundable NFTs

## 📚 Technologies

- Sui Move
- On-chain NFT logic
- Milestone-based logic
- Time-sensitive smart contract flows

---

## 🧑‍💻 Contribution

Feel free to fork and build your own crowdfunding DApp using this module. Contributions and PRs are welcome!

## 📜 Author

Kien Lam

