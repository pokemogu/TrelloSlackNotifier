import Axios, { AxiosInstance } from 'axios';

export class TrelloAPI {
  protected axios: AxiosInstance;
  protected api_base_url: string;
  protected readonly api_get_boards_url_base: string = '/members/me/boards';
  protected readonly api_get_lists_url_base: string = '/boards/{board_id}/lists';
  protected readonly api_get_cards_url_base: string = '/lists/{list_id}/cards';
  protected readonly api_get_member_url_base: string = '/members/{member_id}';
  protected readonly api_get_memberships_url_base: string = '/boards/{board_id}/memberships';
  protected readonly api_get_checkitemstates_url_base: string = '/cards/{card_id}/checkItemStates';
  protected readonly api_get_checklists_url_base: string = '/cards/{card_id}/checklists';
  protected api_get_boards_url: string;
  protected api_get_lists_url: string;
  protected api_get_cards_url: string;
  protected api_get_member_url: string;
  protected api_get_memberships_url: string;
  protected api_get_checkitemstates_url: string;
  protected api_get_checklists_url: string;
  private api_key: string;
  private api_token: string;

  public constructor(key: string, token: string, base_url: string = 'https://api.trello.com/1') {
    this.api_key = key;
    this.api_token = token;
    this.api_base_url = base_url;
    this.api_get_boards_url = `${this.api_get_boards_url_base}?key=${this.api_key}&token=${this.api_token}`;
    this.api_get_lists_url = `${this.api_get_lists_url_base}?key=${this.api_key}&token=${this.api_token}`;
    this.api_get_cards_url = `${this.api_get_cards_url_base}?key=${this.api_key}&token=${this.api_token}`;
    this.api_get_member_url = `${this.api_get_member_url_base}?key=${this.api_key}&token=${this.api_token}`;
    this.api_get_memberships_url = `${this.api_get_memberships_url_base}?key=${this.api_key}&token=${this.api_token}`;
    this.api_get_checkitemstates_url = `${this.api_get_checkitemstates_url_base}?key=${this.api_key}&token=${this.api_token}`;
    this.api_get_checklists_url = `${this.api_get_checklists_url_base}?key=${this.api_key}&token=${this.api_token}`;

    this.axios = Axios.create({
      baseURL: base_url,
      headers: { 'Content-Type': 'application/json' },
      responseType: 'json',
    });
  }

  public async getBoards() {
    try {
      const response = await this.axios.get(this.api_get_boards_url);
      //const board = response.data.find(board => board.name === board_name);
      return response ? response.data : undefined;
    } catch (error) {
      console.log(error);
    }
  }

  public async getLists(board_id: string) {
    try {
      let url = this.api_get_lists_url.replace('{board_id}', board_id);
      const response = await this.axios.get(url);
      return response ? response.data : undefined;
    } catch (error) {
      console.log(error);
    }
  }

  public async getCards(list_id: string) {
    try {
      let url = this.api_get_cards_url.replace('{list_id}', list_id);
      const response = await this.axios.get(url);
      return response ? response.data : undefined;
    } catch (error) {
      console.log(error);
    }
  }

  public async getMember(member_id: string) {
    try {
      let url = this.api_get_member_url.replace('{member_id}', member_id);
      const response = await this.axios.get(url);
      return response ? response.data : undefined;
    } catch (error) {
      console.log(error);
    }
  }

  public async getMembershipsOfBoard(board_id: string) {
    try {
      let url = this.api_get_memberships_url.replace('{board_id}', board_id) + '&member=true&member_fields=id,username';
      const response = await this.axios.get(url);
      return response ? response.data : undefined;
    } catch (error) {
      console.log(error);
    }
  }

  public async getCheckItemStates(card_id: string) {
    try {
      let url = this.api_get_checkitemstates_url.replace('{card_id}', card_id);
      const response = await this.axios.get(url);
      return response ? response.data : undefined;
    } catch (error) {
      console.log(error);
    }
  }

  public async getCheckLists(card_id: string) {
    try {
      let url = this.api_get_checklists_url.replace('{card_id}', card_id);
      const response = await this.axios.get(url);
      return response ? response.data : undefined;
    } catch (error) {
      console.log(error);
    }
  }
}