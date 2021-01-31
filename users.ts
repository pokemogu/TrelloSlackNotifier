import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamo = new DynamoDB.DocumentClient();

export const getUserBinds = () => {
    const params = { TableName: process.env.USERBINDS_TABLE };
    return dynamo.scan(params).promise();
};

export const putUser = (trello_username, slack_memberid) => {
    const params = { TableName: process.env.USERBINDS_TABLE, Item: { trello_username: trello_username, slack_memberid: slack_memberid } };
    return dynamo.put(params).promise();
};

export const getUser = (trello_username) => {
    const params = { TableName: process.env.USERBINDS_TABLE, Key: { trello_username: trello_username } };
    return dynamo.get(params).promise();
};

export const removeUser = (trello_username) => {
    const params = { TableName: process.env.USERBINDS_TABLE, Key: { trello_username: trello_username } };
    return dynamo.delete(params).promise();
};

export const register: APIGatewayProxyHandler = async (event, _context) => {
    const json = JSON.parse(event.body);

    if (!json.users) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: 'No users specified.'
            }, null, 2),
        }
    }

    for (let user of json.users) {
        await putUser(user.trello_username, user.slack_memberid);
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Trello and Slack user binds successfully registered.'
        }, null, 2),
    };
}

export const query: APIGatewayProxyHandler = async (event, _context) => {

    if (!event.pathParameters.trello_username) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: 'No trello_username specified.'
            }, null, 2),
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Go Serverless Webpack (Typescript) v1.0! Your function executed successfully!'
        }, null, 2),
    };
}

export const remove: APIGatewayProxyHandler = async (event, _context) => {

    if (!event.pathParameters.trello_username) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: 'No trello_username specified.'
            }, null, 2),
        }
    }

    await removeUser(event.pathParameters.trello_username);

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Trello and Slack user bind successfully removed.'
        }, null, 2),
    }
}
