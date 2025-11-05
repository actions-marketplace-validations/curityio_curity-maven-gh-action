// Mock @actions/core before requiring our module
jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  setOutput: jest.fn(),
  setSecret: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  debug: jest.fn(),
  setFailed: jest.fn(),
  getState: jest.fn()
}));

// Mock @actions/exec
jest.mock('@actions/exec', () => ({
  exec: jest.fn()
}));

// Mock axios
jest.mock('axios');

// Mock fs
jest.mock('fs');

const { createMavenSettings, getAccessToken } = require('../src/index');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const mockedAxios = axios;

describe('Maven OAuth Action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createMavenSettings', () => {
    it('should create valid Maven settings.xml', () => {
      const accessToken = 'test-token-123';
      const serverId = 'test-server';
      const settingsPath = '/tmp/settings.xml';
      
      // Mock fs functions
      fs.existsSync.mockReturnValue(true);
      fs.writeFileSync.mockImplementation(() => {});
      
      const result = createMavenSettings(accessToken, serverId, settingsPath);
      
      expect(result).toBe(settingsPath);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        settingsPath,
        expect.stringContaining('<id>test-server</id>'),
        'utf8'
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
          settingsPath,
          expect.stringContaining(`<value>Bearer ${accessToken}</value>`),
        'utf8'
      );
    });

    it('should create directory if it does not exist', () => {
      const accessToken = 'test-token';
      const serverId = 'test-server';
      const settingsPath = '/new/path/settings.xml';
      
      fs.existsSync.mockReturnValue(false);
      fs.mkdirSync.mockImplementation(() => {});
      fs.writeFileSync.mockImplementation(() => {});
      
      createMavenSettings(accessToken, serverId, settingsPath);
      
      expect(fs.mkdirSync).toHaveBeenCalledWith('/new/path', { recursive: true });
    });
  });

  describe('getAccessToken', () => {
    it('should successfully obtain access token', async () => {
      const mockResponse = {
        status: 200,
        data: {
          access_token: 'mock-access-token',
          token_type: 'Bearer',
          expires_in: 3600
        }
      };
      
      mockedAxios.post.mockResolvedValue(mockResponse);
      
      const token = await getAccessToken(
        'https://oauth.example.com/token',
        'client-id',
        'client-secret',
        'scope'
      );
      
      expect(token).toBe('mock-access-token');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://oauth.example.com/token',
        expect.any(URLSearchParams),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          })
        })
      );
    });

    it('should handle OAuth server errors', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { error: 'invalid_client' }
        }
      };
      
      mockedAxios.post.mockRejectedValue(mockError);
      
      await expect(getAccessToken(
        'https://oauth.example.com/token',
        'invalid-client',
        'invalid-secret',
        ''
      )).rejects.toThrow('OAuth request failed with status 401');
    });

    it('should handle network errors', async () => {
      const mockError = {
        request: {},
        message: 'Network Error'
      };
      
      mockedAxios.post.mockRejectedValue(mockError);
      
      await expect(getAccessToken(
        'https://oauth.example.com/token',
        'client-id',
        'client-secret',
        ''
      )).rejects.toThrow('No response received from OAuth server');
    });

    it('should include scope in request when provided', async () => {
      const mockResponse = {
        status: 200,
        data: { access_token: 'mock-token' }
      };
      
      mockedAxios.post.mockResolvedValue(mockResponse);
      
      await getAccessToken(
        'https://oauth.example.com/token',
        'client-id',
        'client-secret',
        'read write'
      );
      
      const callArgs = mockedAxios.post.mock.calls[0];
      const formData = callArgs[1];
      
      expect(formData.get('scope')).toBe('read write');
    });
  });
});