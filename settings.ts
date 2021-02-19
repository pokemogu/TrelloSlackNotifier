import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { getUserBinds, putUser, removeUser } from './users';
import * as crypto from 'crypto';
import * as querystring from 'querystring';

const dynamo = new DynamoDB.DocumentClient();

const putSettings = (name, value) => {
  const params = { TableName: process.env.SETTINGS_TABLE, Item: { name: name, value: value } };
  return dynamo.put(params).promise();
};

export const getSettings = () => {
  const params = { TableName: process.env.SETTINGS_TABLE };
  return dynamo.scan(params).promise();
};

export const configure: APIGatewayProxyHandler = async (event, _context) => {
  const json = JSON.parse(event.body);
  console.log(json);

  if (json.settings.trello_api_key) {
    await putSettings('TrelloAPIKey', json.settings.trello_api_key);
  }
  if (json.settings.trello_api_token) {
    await putSettings('TrelloAPIToken', json.settings.trello_api_token);
  }
  if (json.settings.slack_webhook) {
    await putSettings('SlackWebhook', json.settings.slack_webhook);
  }
  if (json.settings.due_today_message) {
    await putSettings('DueTodayMessage', json.settings.due_today_message);
  }
  if (json.settings.overdue_message) {
    await putSettings('OverdueMessage', json.settings.overdue_message);
  }
  if (json.settings.target_boards) {
    await putSettings('TargetBoards', json.settings.target_boards);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless Webpack (Typescript) v1.0! Your function executed successfully!',
      input: event,
    }, null, 2),
  };
}

export const slackcommand: APIGatewayProxyHandler = async (event, _context) => {
  const params = querystring.parse(event.body);
  const slack_secret = process.env.SLACK_SIGNING_SECRET;

  const slack_signature = event.headers['X-Slack-Signature'];
  const slack_timestamp = event.headers['X-Slack-Request-Timestamp'];

  const sig_basestring = 'v0:' + slack_timestamp + ':' + event.body;
  const hmac = crypto.createHmac('sha256', slack_secret);
  hmac.update(sig_basestring);
  const my_signature = 'v0=' + hmac.digest('hex');

  if (my_signature !== slack_signature) {
    throw Error('Invalid Token');
    return;
  }

  //    const promise = new Promise<APIGatewayProxyResult>((resolve) => {
  //
  //    });
  //    return promise;
  //const promise2 = new Promise<APIgateway
  //console.log(`my_signature = ${my_signature}`);
  //console.log(`X-Slack-Signature = ${slack_signature}`);

  let slack_params = undefined;
  if (params.text) {
    slack_params = (params.text as string).split(' ');
  }
  let response_message: string = '';
  switch (params.command) {
    case '/bind_slack_user_to_trello':
      if (!slack_params || slack_params.length !== 2) {
        response_message = '使い方: /bind_slack_user_to_trello @Slackユーザー名 Trelloユーザー名';
      }
      else {
        console.log(`/bind_slack_user_to_trello ${slack_params[0]} ${slack_params[1]}`);
        //const re = /<@([\w]+)\|([\w]+)>/;
        const re = /<@([^>\|]+)\|?([^>\|]+)?>/;
        const matches = re.exec(slack_params[0]);
        if (!matches || matches.length < 2) {
          throw Error('Invalid Parameters');
          return;
        }
        const slack_username = matches[1];
        const trello_username = slack_params[1];

        const result = await putUser(trello_username, slack_username);
        console.log(`putUser(): ${result}`);
        response_message = 'ユーザーの結びつけ登録が完了しました。';
      }
      break;
    case '/list_user_binds':
      let scan_result = await getUserBinds();

      if (scan_result.Items.length > 0) {
        response_message = "【Slackユーザー名】 → 【Trelloユーザー名】\n\n";
        scan_result.Items.forEach((element) => {
          response_message += `- <@${element.slack_memberid}> → ${element.trello_username}\n`;
        });
        /*
        const trello_field_header = 'TrelloUsername';
        const slack_field_header = 'SlackID';
        let trello_field_maxsize = trello_field_header.length;
        let slack_field_maxsize = slack_field_header.length;

        scan_result.Items.forEach((element) => {
            trello_field_maxsize = Math.max(trello_field_maxsize, element.trello_username.length);
            slack_field_maxsize = Math.max(slack_field_maxsize, element.slack_memberid.length);
        });

        response_message = '```';
        response_message += '|' + slack_field_header.padEnd(slack_field_maxsize) + '|' + trello_field_header.padEnd(trello_field_maxsize) + "|\n";
        scan_result.Items.forEach((element) => {
            response_message += '|' + '-'.repeat(slack_field_maxsize) + '|' + '-'.repeat(trello_field_maxsize) + "|\n";
            response_message += '|' + element.slack_memberid.padEnd(slack_field_maxsize) + '|' + element.trello_username.padEnd(trello_field_maxsize) + "|\n";
        });
        response_message += '```';
        */
      }
      else {
        response_message = '結びつけられているユーザーはありません。';
      }

      break;
    case '/delete_user_bind':
      if (!slack_params || slack_params.length !== 1) {
        response_message = '使い方: /delete_user_bind @Slackユーザー名';
      }
      else {
        //const re = /<@([\w]+)\|([\w]+)>/;
        const re = /<@([^>\|]+)\|?([^>\|]+)?>/;
        const matches = re.exec(slack_params[0]);
        if (!matches || matches.length < 2) {
          throw Error('Invalid Parameters');
          return;
        }
        const slack_username = matches[1];
        let scan_result = await getUserBinds();
        const scan_find_result = scan_result.Items.find((item) => item.slack_memberid === slack_username);
        await removeUser(scan_find_result.trello_username);
        response_message = 'ユーザーの結びつけ削除が完了しました。';
      }
      break;
    case '/set_server_setting':
      if (!slack_params || slack_params.length !== 2) {
        response_message = "使い方: /set_server_setting 設定項目名 設定値\n\n";
        response_message += "【設定項目名の一覧】\n";
        response_message += "- TrelloAPIKey Trello接続用のAPIキーを設定する\n";
        response_message += "- TrelloAPIToken Trello接続用のAPIトークンを設定する\n";
        response_message += "- SlackWebhook Slack接続用のWebhookを設定する\n";
        response_message += "- DueTodayMessage 本日期限のカードを通知する際のメッセージを設定する\n";
        response_message += "- OverdueMessage 期限切れのカードを通知する際のメッセージを設定する\n";
        response_message += "- TargetBoards 検索対象のTrelloボード名をカンマ(,)区切りで設定する。何も設定しなければワークスペースの全ボードを検索する。\n";
      }
      else {
        const available_setting_name = Array(
          'TrelloAPIKey',
          'TrelloAPIToken',
          'SlackWebhook',
          'DueTodayMessage',
          'OverdueMessage',
          'TargetBoards'
        );
        if (!available_setting_name.find((name) => name === slack_params[0])) {
          response_message = '設定項目名が間違っています。';
        }
        else {
          await putSettings(slack_params[0], slack_params[1]);
          response_message = '設定が完了しました。';
        }
      }
      break;
    case '/list_server_setting':
      let settings_scan_result = await getSettings();
      if (settings_scan_result.Items.length > 0) {
        response_message = "【設定項目名】 → 【設定値】\n\n";
        settings_scan_result.Items.forEach((element) => {
          response_message += `- ${element.name} → ${element.value}\n`;
        });
      }
      else {
        response_message = '設定されている設定項目はありません。';
      }
      break;
    default:
      throw Error(`Invalid Command: ${params.command}`);
      break;
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: response_message
          }
        }
      ]
    }, null, 2),
  };
}