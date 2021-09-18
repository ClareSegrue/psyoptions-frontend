#!/bin/bash
set -xe

echo 'running local setup'

cd $OPTIONS_REPO
# build the programs
anchor build
# set the config to localnet
solana config set --url http://localhost:8899 --keypair $KEY_FILE
# airdrop tokens before 
solana airdrop 100
solana airdrop 100 $WALLET_ADDRESS

# deploy the program
solana program deploy --program-id $OPTIONS_REPO/target/deploy/psy_american-keypair.json $OPTIONS_REPO/target/deploy/psy_american.so

# Deploy the Serum DEX
cd $DEX_REPO
cargo build-bpf --manifest-path dex/Cargo.toml
solana program deploy $DEX_REPO/dex/target/deploy/serum_dex.so
# TODO append the DEX program ID to the .env file if it is not already there

cd $FRONTEND_REPO
# seed the chain with multiple assets
npm run seed -- $KEY_FILE
sleep 10
npm run seed:mintTokens -- $KEY_FILE $WALLET_ADDRESS

npm run seed:localChain $OPTIONS_REPO/options/deployed_programs/psyoptions-local-keypair.json