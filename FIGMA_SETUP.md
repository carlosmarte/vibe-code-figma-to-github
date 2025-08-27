# Figma API Setup Instructions

## Getting Your Figma Personal Access Token

To enable component preview functionality, you need to set up a Figma Personal Access Token.

### Step 1: Get Your Token

1. Go to your [Figma account settings](https://www.figma.com/settings)
2. Navigate to the "Personal access tokens" section
3. Click "Create new token"
4. Give it a descriptive name (e.g., "Figma Export Tool")
5. Copy the token (it starts with `figd_`)

### Step 2: Configure the Backend

Create a `.env` file in the `backend` directory:

```bash
cd backend
```

Add your token to the `.env` file:

```env
FIGMA_TOKEN=figd_your_token_here
```

### Step 3: Restart the Backend

```bash
npm run restart
```

## Testing the Setup

Once configured, you can test the preview functionality:

1. Import a Figma file using ID: `tmaZV2VEXIIrWYVjqaNUxa`
2. Go to the Extraction tab
3. Select any component
4. The preview should appear on the right side

## Troubleshooting

### Preview Not Loading

- **Check Token**: Ensure your FIGMA_TOKEN is correctly set in `backend/.env`
- **Token Permissions**: Make sure your token has read access to the files you're trying to access
- **File Access**: Verify you have access to the Figma file in your Figma account

### API Rate Limits

Figma API has rate limits. If you encounter errors:
- Wait a few minutes before retrying
- Consider implementing caching for frequently accessed files

## Security Notes

- Never commit your `.env` file to version control
- Keep your Figma token secure and rotate it periodically
- The token provides read access to your Figma files