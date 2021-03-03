import { APIGatewayProxyHandler } from 'aws-lambda';
import { TrelloAPI } from './trelloapi';
import { SlackAPI } from './slackapi';
import { DynamoDB } from 'aws-sdk';

const dynamo = new DynamoDB.DocumentClient();

const getSettings = (name) => {
  const params = { TableName: process.env.SETTINGS_TABLE, Key: { name: name } };
  return dynamo.get(params).promise();
};

const getUserBinds = () => {
  const params = { TableName: process.env.USERBINDS_TABLE };
  return dynamo.scan(params).promise();
};

export const notify: APIGatewayProxyHandler = async (event, _context) => {
  let trello: TrelloAPI;
  let trello_api_key: string;
  let trello_api_token: string;
  let slack_webhook_url: string;
  let slack_trello_task_due_today_message: string;
  let slack_trello_task_overdue_message: string;
  let trello_slack_user_bind: any;
  let target_boards: string[] = undefined;

  const trello_api_key_result = await getSettings('TrelloAPIKey');
  const trello_api_token_result = await getSettings('TrelloAPIToken');
  const slack_webhook_result = await getSettings('SlackWebhook');
  const due_today_message_result = await getSettings('DueTodayMessage');
  const overdue_message_result = await getSettings('OverdueMessage');
  const target_boards_result = await getSettings('TargetBoards');

  if (trello_api_key_result.Item)
    trello_api_key = trello_api_key_result.Item.value;
  else
    throw new Error(`エラー: DynamoDBのテーブル${process.env.SETTINGS_TABLE}に'TrelloAPIKey'が設定されていません。`);

  if (trello_api_token_result.Item)
    trello_api_token = trello_api_token_result.Item.value;
  else
    throw new Error(`エラー: DynamoDBのテーブル${process.env.SETTINGS_TABLE}に'TrelloAPIToken'が設定されていません。`);

  if (slack_webhook_result.Item)
    slack_webhook_url = slack_webhook_result.Item.value;
  else
    throw new Error(`エラー: DynamoDBのテーブル${process.env.SETTINGS_TABLE}に'SlackWebhook'が設定されていません。`);

  const user_binds_result = await getUserBinds();
  if (user_binds_result)
    trello_slack_user_bind = user_binds_result.Items;
  else
    throw new Error(`エラー: DynamoDBのテーブル${process.env.USERBINDS_TABLE}が設定されていません。`);

  if (due_today_message_result.Item)
    slack_trello_task_due_today_message = due_today_message_result.Item.value;
  else
    slack_trello_task_due_today_message = 'チケットの対応期限が本日迄です。対応をお忘れなく。';

  if (overdue_message_result.Item)
    slack_trello_task_overdue_message = overdue_message_result.Item.value;
  else
    slack_trello_task_overdue_message = 'チケットの対応期限が切れています。急ぎ対応をお願いします。';

  if (target_boards_result.Item)
    target_boards = target_boards_result.Item.value.split(',')

  if (process.env.TRELLO_API_BASE_URL)
    trello = new TrelloAPI(trello_api_key, trello_api_token, process.env.TRELLO_API_BASE_URL);
  else
    trello = new TrelloAPI(trello_api_key, trello_api_token);

  let slack = new SlackAPI(slack_webhook_url);

  const today: string = new Date().toISOString().split('T')[0];
  //const today = new Date();
  //today.setHours(0, 0, 0, 0);

  //const board_id = await trello.getBoardId('サンプルボード');
  const boards = await trello.getBoards();
  for (let board of boards) {

    if (target_boards) {
      if (!target_boards.some((board_name) => board_name == board.name)) {
        continue;
      }
    }

    console.log(`Entering Board name = ${board.name}, id = ${board.id}`);
    const memberships = await trello.getMembershipsOfBoard(board.id);
    const lists = await trello.getLists(board.id);

    for (let list of lists) {
      console.log(`\tEntering List name = ${list.name}, id = ${list.id}`);
      const cards = await trello.getCards(list.id);
      const cards_due_today = cards.filter((v: any) => (v.dueComplete == false && v.due != null && v.due.slice(0, 10) === today));
      const cards_overdue = cards.filter((v: any) => (v.dueComplete == false && v.due != null && v.due.slice(0, 10) < today));

      let cards_lists_due: any[] = [
        [cards_due_today, slack_trello_task_due_today_message],
        [cards_overdue, slack_trello_task_overdue_message],
      ];

      cards_lists_due.forEach((cards_list_due) => {
        for (const card of cards_list_due[0]) {
          let message = '';
          let mention = '';

          for (const trello_id of card.idMembers) {
            const trello_membership = memberships.find((membership: any) => membership.member.id === trello_id);
            const username_bind = trello_slack_user_bind.find((user: any) => user.trello_username === trello_membership.member.username);
            if (username_bind)
              mention = `${mention}<@${username_bind.slack_memberid}>`;
          }
          if (mention != null)
            message = `${mention}\n`;

          message = `${message}${cards_list_due[1]}\n`;
          message = `${message}<${card.shortUrl}|${card.name}>`;

          slack.sendMessage(message);
        }
      });

      const cards_due_checkitems = cards.filter((v: any) => (v.dueComplete == false && v.badges.checkItemsEarliestDue !== null && v.badges.checkItemsEarliestDue.slice(0, 10) <= today));
      for (const card of cards_due_checkitems) {
        const checklists = await trello.getCheckLists(card.id);

        for (const checklist of checklists) {
          const checkitems_due_today = checklist.checkItems.filter((v: any) => (v.state == 'incomplete' && v.due != null && v.due.slice(0, 10) === today));
          const checkitems_overdue = checklist.checkItems.filter((v: any) => (v.state == 'incomplete' && v.due != null && v.due.slice(0, 10) < today));

          let checkitems_lists_due: any[] = [
            [checkitems_due_today, slack_trello_task_due_today_message],
            [checkitems_overdue, slack_trello_task_overdue_message],
          ];

          checkitems_lists_due.forEach((checkitems_list_due) => {
            for (const checkitem of checkitems_list_due[0]) {
              const trello_membership = memberships.find((membership: any) => membership.member.id === checkitem.idMember);
              const username_bind = trello_slack_user_bind.find((user: any) => user.trello_username === trello_membership.member.username);
              let message = '';
              if (username_bind)
                message = `<@${username_bind.slack_memberid}>`;
              console.log(checkitem);
              message = `${message}${checkitems_list_due[1]}\n`;
              message = `${message}<${card.shortUrl}|${card.name} ✓ ${checklist.name} - ${checkitem.name}>`;
              slack.sendMessage(message);
            }
          });
        }
      }
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless Webpack (Typescript) v1.0! Your function executed successfully!',
      input: event,
    }, null, 2),
  };
}