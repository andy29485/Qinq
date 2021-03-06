/*
 * Copyright (c) 2016, Andriy Zasypkin.
 *
 * This file is part of Qinq.
 *
 * Qinq(or QINQ) is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version.
 *
 * Qinq in distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * Qinq. If not, see <http://www.gnu.org/licenses/>.
 */

package qinq.application;

import java.util.ArrayList;
import java.util.List;

import javafx.application.Platform;
import javafx.scene.control.Alert;
import javafx.scene.control.ScrollPane;
import qinq.resource.Game;
import qinq.resource.Player;

public class GameUI extends ScrollPane {
  private GameServer  server;
  private Game        game;
  private SetupPane   setup;
  private OptionsPane options;

  public GameUI(GameServer server, Game game) {
    this.game = game;
    this.server = server;
    this.setup = new SetupPane(this, server, game);
    this.options = new OptionsPane(this, game, server);

    this.game.setGameUI(this);

    this.goToSetup();
    this.setFitToWidth(true);
    this.setFitToHeight(true);
  }

  public void goToSetup() {
    Platform.runLater(new Runnable() {
      @Override
      public void run() {
        GameUI.this.setContent(GameUI.this.setup);
      }
    });
  }

  public void goToOptions() {
    Platform.runLater(new Runnable() {
      @Override
      public void run() {
        GameUI.this.setContent(GameUI.this.options);
      }
    });
  }

  public void addPlayer(Player p) {
    this.setup.addPlayer(p);
  }

  public void exit() {
    new Thread(new Runnable() {
      @Override
      public void run() {
        for (Player p : GameUI.this.game.getPlayers())
          p.getSocket().close();
        for (Player p : GameUI.this.game.getSpectators())
          p.getSocket().close();
      }
    }).start();
    this.server.stop();
    this.options.stopRemoteConn();
    System.exit(0);
  }

  public void setGame(Game g) {
    this.game = g;
  }

  public void startGame() {

    // This stuff probably should not be here, or maybe it should?
    List<String> questions = new ArrayList<String>();
    for (String question : this.options.getQuestions())
      questions.add(question);

    GamePane display = new GamePane(game);
    Platform.runLater(new Runnable() {
      @Override
      public void run() {
        GameUI.this.setContent(display);
      }
    });
    switch (this.game.start(questions, display, this)) {
      case 1:
        new Alert(Alert.AlertType.ERROR,
            "Game Has started, how are you doing this?").showAndWait();
        this.goToSetup();
        break;
      case 2:
        new Alert(Alert.AlertType.ERROR, "Not enough players").showAndWait();
        this.goToSetup();
        break;
      case 3:
        new Alert(Alert.AlertType.ERROR, "Not enough Questions").showAndWait();
        this.goToSetup();
        break;
    }
  }

  public void setRemoteUrl(String url) {
    this.setup.resetAddresses();
    this.setup.addAddress(url);
  }

  public void removeRemoteUrl() {
    this.setup.resetAddresses();
  }
}
