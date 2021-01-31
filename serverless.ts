import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'trelloslack',
  frameworkVersion: '2',
  custom: {
    webpack: {
      webpackConfig: './webpack.config.js',
      includeModules: true
    }
  },
  useDotenv: true,
  // Add the serverless-webpack plugin
  plugins: ['serverless-webpack'/*, 'serverless-add-api-key'*/],
  provider: {
    region: 'ap-northeast-1',
    /*
        apiKeys: [
          'apiKey1',
        ],
    */
    name: 'aws',
    runtime: 'nodejs12.x',
    memorySize: 128,
    timeout: 900,
    apiGateway: {
      minimumCompressionSize: 1024,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      DYNAMODB_TABLE: '${self:service}-${self:provider.stage}',
      SETTINGS_TABLE: '${self:provider.environment.DYNAMODB_TABLE}-settings',
      USERBINDS_TABLE: '${self:provider.environment.DYNAMODB_TABLE}-userbinds',
      // Slack APIのSigning Secret値を設定する。
      SLACK_SIGNING_SECRET: '${env:SLACK_SIGNING_SECRET}'
    },
    iamRoleStatements: [
      {
        Effect: 'Allow',
        Action: [
          'dynamodb:Query',
          'dynamodb:Scan',
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
        ],
        Resource: 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.DYNAMODB_TABLE}*',
      },
    ],
  },
  resources: {
    Resources: {
      Settings: {
        // @ts-ignore
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: '${self:provider.environment.SETTINGS_TABLE}',
          AttributeDefinitions: [
            {
              AttributeName: 'name',
              AttributeType: 'S',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'name',
              KeyType: 'HASH',
            },
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
          },
        },
      },
      UserBinds: {
        // @ts-ignore
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: '${self:provider.environment.USERBINDS_TABLE}',
          AttributeDefinitions: [
            {
              AttributeName: 'trello_username',
              AttributeType: 'S',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'trello_username',
              KeyType: 'HASH',
            },
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
          },
        },
      }
    },
  },
  functions: {
    notify: {
      handler: 'handler.notify',
      maximumRetryAttempts: 0,
      events: [
        {
          // 実行スケジュールを協定世界時間(UTC)で設定する。(日本時間とは時差-9時間)
          schedule: 'cron(0 0 ? * MON-FRI *)',
          http: {
            method: 'post',
            path: 'notify',
            private: true
          }
        }
      ],
      environment: {
        no_proxy: 'localhost,127.0.0.0/8,::1,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,*.local,api.trello.com,hooks.slack.com'
      }
    },
    configure: {
      handler: 'settings.configure',
      events: [
        {
          http: {
            method: 'post',
            path: 'configure',
            private: true
          }
        }
      ],
      environment: {
        no_proxy: 'localhost,127.0.0.0/8,::1,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,*.local,api.trello.com,hooks.slack.com'
      }
    },
    slackcommand: {
      handler: 'settings.slackcommand',
      events: [
        {
          http: {
            method: 'post',
            path: 'slackcommand',
            private: false
          }
        }
      ],
      environment: {
        no_proxy: 'localhost,127.0.0.0/8,::1,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,*.local,api.trello.com,hooks.slack.com'
      }
    },
    users_register: {
      handler: 'users.register',
      events: [
        {
          http: {
            method: 'post',
            path: 'users/register',
            private: true
          }
        }
      ],
      environment: {
        no_proxy: 'localhost,127.0.0.0/8,::1,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,*.local,api.trello.com,hooks.slack.com'
      }
    }
  }
};

module.exports = serverlessConfiguration;