import Axios, { AxiosInstance } from 'axios';

export class SlackAPI {
  private webhook_url: string;
  protected axios: AxiosInstance;

  public constructor(webhook_url: string) {
    this.webhook_url = webhook_url;
    this.axios = Axios.create({
      headers: { 'Content-Type': 'application/json' },
      responseType: 'json',
    });
  }

  public async sendMessage(message: string) {
    try {
      const response = await this.axios.post(this.webhook_url, {
        text: message
      });
      return response.status == 200 ? true : false;
    }
    catch (error) {
      console.log(error);
      return false;
    }
  }
}