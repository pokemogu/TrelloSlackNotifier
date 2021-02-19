# Trello期限切れカードをSlackに通知するアプリ セットアップ手順

## 構築手順(Mac)

1. 以下のWebサイトからNode.jsをダウンロードする。LTS推奨版のmacOS Installerをダウンロードする。

    https://nodejs.org/ja/download/

2. ダウンロードしたインストーラ node-vXX.XX.X.pkg を開き、案内にしたがってインストールする。
3. MacのFinderから「アプリケーション」フォルダ→「ユーティリティ」フォルダを開き、その中の「ターミナル」アプリを開く。
4. 以下のコマンドを入力してリターンキーを押して、インストールされたNode.jsのバージョン(vXX.X.X)が表示されることを確認する。

        node -v

5. 以下のコマンドを入力してリターンキーを押して、アプリをダウンロードする。

        git clone https://github.com/pokemogu/TrelloSlackNotifier

6. アプリをダウンロードして作成されたフォルダTrelloSlackNotifierに移動する。

        cd TrelloSlackNotifier

7. 以下のコマンドを入力してリターンキーを押して、外部パッケージファイルをダウンロードする。

        npm install

8. 以下のコマンドを入力してリターンキーを押して、AWSとの接続設定を行なう。「AWSのアクセスキーID」と「AWSのアクセスキー」は、AWSマネージメントコンソールにログインして、右上の自分の名前のメニューから「マイセキュリティ資格情報」をクリックして表示される「アクセスキー」のメニューから「新しいアクセスキーの作成」ボタンを押すと確認できる。

        npx sls config credentials --provider aws --key AWSのアクセスキーID --secret AWSのアクセスキー

9. 以下のコマンドを入力してリターンキーを押して、AWSにアプリがアップロードされることを確認する。

        npx sls deploy