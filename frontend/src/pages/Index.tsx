import { Header } from '@/components/Header';
import { AccountOverview } from '@/components/AccountOverview';
import { TransactionPanel } from '@/components/TransactionPanel';
import { MultiSigPanel } from '@/components/MultiSigPanel';
import { SessionKeysPanel } from '@/components/SessionKeysPanel';
import { TransactionLog } from '@/components/TransactionLog';
import { useAccountAbstraction } from '@/hooks/useAccountAbstraction';

export default function Index() {
  const {
    account,
    logs,
    isProcessing,
    mintNFT,
    createSessionKey,
    revokeSessionKey,
    useSessionKey,
    collectSignature,
  } = useAccountAbstraction();

  return (
    <div className="min-h-screen bg-background bg-grid">
      {/* Glow effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]" />
      </div>

      <Header />

      <main className="container mx-auto px-4 py-8 relative">
        {/* Hero Section */}
        <section className="text-center mb-12 animate-slide-up">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">🔎 Explorer</span>
          </h1>
        </section>

        {/* Account Overview */}
        <section className="mb-8">
          <AccountOverview account={account} />
        </section>

        {/* Transaction Log - Full Width */}
        <section className="mb-8">
          <TransactionLog logs={logs} />
        </section>

        {/* Interactive Panels - 3 columns */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6 text-center">Interactive Demo</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <MultiSigPanel 
              signers={account.signers}
              onCollectSignature={collectSignature}
              isProcessing={isProcessing}
            />
            <TransactionPanel 
              onMintNFT={async () => { await mintNFT(); }} 
              isProcessing={isProcessing} 
            />
            <SessionKeysPanel
              sessionKeys={account.sessionKeys}
              onCreateKey={createSessionKey}
              onRevokeKey={revokeSessionKey}
              onUseKey={useSessionKey}
              isProcessing={isProcessing}
            />
          </div>
        </section>

        {/* Architecture Info */}
        <section className="mt-16 glass-card p-8 animate-slide-up">
          <h2 className="text-xl font-semibold text-foreground mb-4">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-bold text-primary">1</span>
              </div>
              <h3 className="font-medium text-foreground mb-1">Create UserOp</h3>
              <p className="text-xs text-muted-foreground">User creates a UserOperation describing the intended action</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-bold text-primary">2</span>
              </div>
              <h3 className="font-medium text-foreground mb-1">Sign & Validate</h3>
              <p className="text-xs text-muted-foreground">Smart account validates signatures via validateUserOp()</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-bold text-primary">3</span>
              </div>
              <h3 className="font-medium text-foreground mb-1">Bundler Submits</h3>
              <p className="text-xs text-muted-foreground">Bundler packages UserOps and submits to EntryPoint</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-bold text-accent">4</span>
              </div>
              <h3 className="font-medium text-foreground mb-1">Execute</h3>
              <p className="text-xs text-muted-foreground">EntryPoint executes the transaction on the account</p>
            </div>
          </div>
        </section>
      </main>

    </div>
  );
}
