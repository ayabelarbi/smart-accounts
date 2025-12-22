import { Box, Github, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-float">
            <Box className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">Account Abstraction Explorer</h1>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <a href="https://eips.ethereum.org/EIPS/eip-4337" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
              EIP-4337
            </a>
          </Button>

        </nav>
      </div>
    </header>
  );
}
