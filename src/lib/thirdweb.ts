import { createThirdwebClient } from "thirdweb";

// You'll need to replace this with your actual client ID from Thirdweb dashboard
const CLIENT_ID =
  process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "your-client-id-here";

export const client = createThirdwebClient({
  clientId: CLIENT_ID,
});
