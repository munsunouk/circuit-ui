# Circuits UI

## Vaults

Read more about the Vaults program [here](https://github.com/drift-labs/drift-vaults/wiki).

## Setup

Run the following command to setup the project:

`sh ./initial-setup.sh`

This will pull the relevant git submodules, install dependencies, and build the submodules.

If you need to update any submodules, change directory to the submodule, pull the relevant changes, and then run `yarn build` to build the submodule.

## Development

`sh ./build_all_sm.sh` - shortcut to build all submodules and dependencies.
`yarn convert-icons` - place any new icons in `app/public/icons` and run this command to convert them to React components.
`yarn build-vaults` - use this command in the root directory to quickly build the Vaults TS SDK.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
