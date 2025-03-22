import WalletConnect from './components/WalletConnect';
import DonationForm from './components/DonationForm';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Crypto Donation Platform</h1>
        
        <div className="flex justify-end mb-6">
          <WalletConnect />
        </div>
        
        <div className="grid grid-cols-1 gap-8">
          <DonationForm />
        </div>
      </div>
    </main>
  );
}

