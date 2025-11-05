# Maven OAuth Action

A GitHub Action that uses OAuth client credentials flow to obtain an access token and creates a Maven `settings.xml` file with that token for authentication.

## Features

- 🔐 Secure OAuth client credentials flow
- 📁 Automatic Maven `settings.xml` generation
- 🧹 Automatic cleanup of sensitive files
- ✅ Maven environment validation
- 🎯 Configurable server IDs and paths

## Prerequisites

**Important**: This action requires Maven to be available in the runner environment. Use an action like `actions/setup-java` with Maven or `stCarolas/setup-maven` before using this action.

## Usage

### Basic Example

```yaml
name: Build with Maven OAuth

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      # Setup Java and Maven (required prerequisite)
      - name: Set up JDK and Maven
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          
      # Setup Maven with OAuth token
      - name: Setup Maven with OAuth
        uses: your-org/maven-oauth-action@v1
        with:
          oauth-server-url: 'https://oauth.example.com/oauth/token'
          client-id: ${{ secrets.OAUTH_CLIENT_ID }}
          client-secret: ${{ secrets.OAUTH_CLIENT_SECRET }}
          scope: 'maven:read maven:write'
          maven-server-id: 'my-maven-repo'
          
      # Use Maven with the configured settings
      - name: Build with Maven
        run: mvn clean compile -s ${{ steps.setup-maven.outputs.settings-file }}
```

### Advanced Example with Custom Settings Path

```yaml
      - name: Setup Maven with OAuth
        id: maven-setup
        uses: your-org/maven-oauth-action@v1
        with:
          oauth-server-url: ${{ vars.OAUTH_SERVER_URL }}
          client-id: ${{ secrets.OAUTH_CLIENT_ID }}
          client-secret: ${{ secrets.OAUTH_CLIENT_SECRET }}
          scope: 'repo:read'
          maven-server-id: 'private-repo'
          maven-settings-path: './custom-settings.xml'
          
      - name: Deploy to repository
        run: |
          mvn deploy \
            -s ${{ steps.maven-setup.outputs.settings-file }} \
            -DaltDeploymentRepository=private-repo::default::https://maven.example.com/repository/
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `oauth-server-url` | OAuth server token endpoint URL | ✅ Yes | |
| `client-id` | OAuth client ID | ✅ Yes | |
| `client-secret` | OAuth client secret | ✅ Yes | |
| `scope` | OAuth scope to request | ❌ No | `''` |
| `maven-server-id` | Server ID to use in Maven settings.xml | ❌ No | `'default'` |
| `maven-settings-path` | Path where to create the Maven settings.xml file | ❌ No | `'${{ runner.temp }}/settings.xml'` |

## Outputs

| Output | Description |
|--------|-------------|
| `settings-file` | Path to the created Maven settings.xml file |
| `access-token` | The obtained access token (masked in logs) |

## Secrets Setup

This action requires the following secrets to be configured in your repository:

### Required Secrets

- `OAUTH_CLIENT_ID`: Your OAuth client ID
- `OAUTH_CLIENT_SECRET`: Your OAuth client secret

### Setting up Secrets

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each required secret with the appropriate values

### Environment Variables (Optional)

You can also use repository variables for non-sensitive configuration:

- `OAUTH_SERVER_URL`: Your OAuth server endpoint (if it doesn't change)

## Security Considerations

- ✅ Client secrets are properly masked in GitHub Action logs
- ✅ Access tokens are automatically masked using `core.setSecret()`
- ✅ Settings files are automatically cleaned up after the workflow
- ✅ OAuth follows industry-standard client credentials flow
- ✅ Temporary files are created in runner's temp directory by default

## OAuth Server Requirements

Your OAuth server must support the **client credentials flow** (RFC 6749 Section 4.4) and should:

1. Accept `POST` requests to the token endpoint
2. Support `application/x-www-form-urlencoded` content type
3. Return JSON responses with `access_token` field
4. Accept the following parameters:
   - `grant_type=client_credentials`
   - `client_id=<your-client-id>`
   - `client_secret=<your-client-secret>`
   - `scope=<requested-scope>` (optional)

### Example Token Response

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "maven:read maven:write"
}
```

## Generated Maven Settings

The action creates a `settings.xml` file with the following structure:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.2.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.2.0 
                              http://maven.apache.org/xsd/settings-1.2.0.xsd">
  <servers>
    <server>
      <id>your-server-id</id>
      <username>oauth</username>
      <password>your-access-token</password>
    </server>
  </servers>
</settings>
```

## Error Handling

The action performs comprehensive error checking:

- ✅ Validates Maven is available in the environment
- ✅ Validates all required inputs are provided
- ✅ Handles OAuth server connection issues
- ✅ Validates OAuth server responses
- ✅ Provides detailed error messages for debugging

## Development

### Building the Action

```bash
npm install
npm run build
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run `npm run build` to update the `dist/` folder
6. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:

1. Check the [GitHub Issues](https://github.com/your-org/maven-oauth-action/issues) for existing problems
2. Create a new issue with detailed information about your problem
3. Include your workflow YAML and any relevant error messages (redact sensitive information)

## Changelog

### v1.0.0
- Initial release
- OAuth client credentials flow support
- Maven settings.xml generation
- Automatic cleanup functionality
- Maven environment validation