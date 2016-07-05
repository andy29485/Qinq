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

import javafx.application.Platform;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.FlowPane;
import javafx.scene.layout.HBox;
import qinq.resource.Game;
import qinq.resource.Player;

public class SetupPane extends BorderPane {
  private Label    addressLabel;
  private FlowPane players;
  private Game     game;        // May not even be needed

  public SetupPane(GameUI root, GameServer server, Game game) {
    this.addressLabel = new Label(server.getAddress());
    this.players = new FlowPane();
    this.game = game;

    this.players.setPadding(new Insets(10, 10, 10, 10));

    HBox top = new HBox(5);
    HBox bottom = new HBox(20);
    Button buttonStart = new Button("Start");
    Button buttonOpt = new Button("Options");
    Button buttonExit = new Button("Exit");

    this.addressLabel.setId("address-label");
    top.setId("header");
    top.getChildren().add(new Label("Go to: "));
    top.getChildren().add(this.addressLabel);
    top.getChildren().add(new Label(" to start playing"));
    top.setAlignment(Pos.CENTER);

    buttonStart.setOnAction(e -> {
      root.startGame();
    });

    buttonOpt.setOnAction(e -> {
      root.goToOptions();
    });

    buttonExit.setOnAction(e -> {
      root.exit();
    });
    bottom.getChildren().add(buttonStart);
    bottom.getChildren().add(buttonOpt);
    bottom.getChildren().add(buttonExit);
    bottom.setAlignment(Pos.CENTER);

    this.setTop(top);
    this.setCenter(this.players);
    this.setBottom(bottom);
  }

  public void addPlayer(Player p) {
    Platform.runLater(new Runnable() {
      @Override
      public void run() {
        SetupPane.this.players.getChildren().add(p.getLargeLabel());
      }
    });
  }
}
