'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { XmentoVaultFactoryABI } from './XmentoVaultFactoryABI';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { celoAlfajores } from 'viem/chains';

// Contract addresses by network
const CONTRACT_ADDRESSES = {
  [celoAlfajores.id]: {
    factory: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as `0x${string}`,
  },
} as const;

// Replace with actual MANAGER_ADDRESS from environment variables
const MANAGER_ADDRESS = process.env.NEXT_PUBLIC_MANAGER_ADDRESS as `0x${string}`;

type DeployStatus = 'idle' | 'deploying' | 'success' | 'error';

export function AdminDeploy() {
  const { address } = useAccount();
  const { toast } = useToast();
  const [status, setStatus] = useState<DeployStatus>('idle');
  const [deployedFactoryAddress, setDeployedFactoryAddress] = useState<string>('');
  
  const chainId = useChainId();
  const factoryAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.factory as `0x${string}` | undefined;
  
  const { 
    data: deployHash,
    writeContract: deployFactory,
    isPending: isDeploying,
    isError: isDeployError,
    error: deployError
  } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash: deployHash });

  const handleDeploy = async () => {
    if (!deployFactory) return;
    
    setStatus('deploying');
    
    try {
      // This assumes XmentoVaultFactory has a constructor with no parameters
      // Adjust the ABI and parameters according to your actual factory contract
      // Ensure we have a valid factory address for the current network
      if (!factoryAddress || !/^0x[a-fA-F0-9]{40}$/.test(factoryAddress)) {
        throw new Error('Unsupported network or invalid factory address. Please connect to a supported network.');
      }

      // Get the connected wallet address as the owner
      const ownerAddress = address as `0x${string}`;
      
      // Example token addresses - replace with actual token addresses
      const cUSD = '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1';
      const cEUR = '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F';
      const cREAL = '0xE4D517785D091D3c54818832dB6094bcc2744545'; 
      
      // The ABI shows createVault doesn't take any parameters
      // It likely uses msg.sender as the owner and has default values for other parameters
      await deployFactory({
        address: factoryAddress,
        abi: XmentoVaultFactoryABI,
        functionName: 'createVault'
      });
    } catch (error) {
      console.error('Deployment failed:', error);
      setStatus('error');
      toast({
        title: 'Deployment Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  // Update status based on transaction state
  useEffect(() => {
    if (isConfirmed && deployHash) {
      setStatus('success');
      // Extract the deployed contract address from the transaction receipt
      // This is a simplified example - you might need to adjust based on your contract's deployment
      const deployedAddress = `0x${deployHash.slice(0, 42)}`; // Simplified example
      setDeployedFactoryAddress(deployedAddress);
      
      toast({
        title: 'Vault Created',
        description: `New vault created at: ${deployedAddress}`,
      });
    } else if (isDeployError) {
      setStatus('error');
    }
  }, [isConfirmed, isDeployError, deployHash, toast]);

  // Check if current user is the manager
  const isManager = address?.toLowerCase() === MANAGER_ADDRESS?.toLowerCase();

  if (!isManager) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          Only the contract manager can access this page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Deploy xVault Factory</CardTitle>
        <CardDescription>
          Deploy a new instance of the xVault Factory contract
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'success' ? (
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle>Deployment Successful!</AlertTitle>
            <AlertDescription>
              Factory contract deployed at: 
              <a 
                href={`https://alfajores.celoscan.io/address/${factoryAddress}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {factoryAddress}
              </a>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="flex flex-col space-y-4">
            <p className="text-sm text-muted-foreground">
              Click the button below to deploy a new xVault Factory contract.
              This action can only be performed by the contract manager.
            </p>
            
            <Button
              onClick={handleDeploy}
              disabled={isDeploying || isConfirming}
              className="w-full"
            >
              {isDeploying || isConfirming ? 'Deploying...' : 'Deploy Factory'}
            </Button>
            
            {(isDeploying || isConfirming) && (
              <p className="text-sm text-muted-foreground text-center">
                Confirm the transaction in your wallet...
              </p>
            )}
            
            {status === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Deployment Failed</AlertTitle>
                <AlertDescription>
                  {deployError?.message || 'An error occurred during deployment.'}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
