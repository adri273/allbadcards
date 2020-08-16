import {Redirect, RouteComponentProps, withRouter} from "react-router";
import React from "react";
import {GameDataStore, GameDataStorePayload} from "@Global/DataStore/GameDataStore";
import {UserData, UserDataStore} from "@Global/DataStore/UserDataStore";
import Helmet from "react-helmet";
import {Dialog, DialogContent, Typography} from "@material-ui/core";
import {ContainerProgress} from "@UI/ContainerProgress";
import {LoadingButton} from "@UI/LoadingButton";
import {Support} from "./Components/Gameplay/Support";
import {GameChatFab} from "./Components/Chat/GameChatFab";
import {ChatSidebar} from "./Components/Chat/ChatSidebar";
import {GameInner} from "./Components/Gameplay/GameInner";
import {SocketDataStore, SocketDataStorePayload} from "@Global/DataStore/SocketDataStore";
import moment from "moment";
import {getTrueRoundsToWin} from "@Global/Utils/GameUtils";
import {ClientGameItem} from "@Global/Platform/Contract";
import {PlayerJoinApproval} from "@Areas/Game/Components/Gameplay/PlayerJoinApproval";
import {UpdateGameUrl} from "@Areas/Game/GameUrlUpdater";
import {AuthDataStore, IAuthContext} from "@Global/DataStore/AuthDataStore";

interface IGameParams
{
	id: string;
}

interface IGameState
{
	socketData: SocketDataStorePayload;
	gameData: GameDataStorePayload;
	userData: UserData;
	restartLoading: boolean;
	restartDelayed: boolean;
	showSupport: boolean;
	chatDrawerOpen: boolean;
	authContext: IAuthContext;
}

class Game extends React.Component<RouteComponentProps<IGameParams>, IGameState>
{
	private supportDelayTimeout = 0;

	constructor(props: RouteComponentProps<IGameParams>)
	{
		super(props);

		this.state = {
			socketData: SocketDataStore.state,
			gameData: GameDataStore.state,
			userData: UserDataStore.state,
			restartLoading: false,
			restartDelayed: true,
			showSupport: false,
			chatDrawerOpen: true,
			authContext: AuthDataStore.state
		};
	}

	public componentDidMount(): void
	{
		GameDataStore.hydrate(this.props.match.params.id);

		SocketDataStore.listen(data => this.setState({
			socketData: data
		}));

		GameDataStore.listen(data =>
		{
			this.setState({
				gameData: data
			});

			UpdateGameUrl(data, this.state.userData, this.props.match);
		});

		UserDataStore.listen(data => this.setState({
			userData: data
		}));

		AuthDataStore.listen(data => this.setState({
			authContext: data
		}));
	}

	private getWinnerFromState(state: IGameState)
	{
		const {
			players,
		} = state.gameData.game ?? {};

		const playerGuids = Object.keys(players ?? {});
		const roundsToWin = getTrueRoundsToWin(state.gameData.game as ClientGameItem);
		const winnerGuid = playerGuids.find(pg => (players?.[pg].wins ?? 0) >= roundsToWin);
		return winnerGuid;
	}

	public componentDidUpdate(prevProps: Readonly<RouteComponentProps<IGameParams>>, prevState: Readonly<IGameState>, snapshot?: any): void
	{
		const hadWinner = this.getWinnerFromState(prevState);
		const hasWinner = this.getWinnerFromState(this.state);
		if (!hadWinner && hasWinner && this.supportDelayTimeout === 0)
		{
			this.supportDelayTimeout = window.setTimeout(() =>
			{
				this.setState({
					restartDelayed: true,
					showSupport: true
				});

				setTimeout(() => this.setState({
					restartDelayed: false
				}), 5000);

			}, 2000);
		}
	}

	private restartClick = (playerGuid: string) =>
	{
		this.setState({
			restartLoading: true
		});

		GameDataStore.restart(playerGuid)
			.finally(() => this.setState({
				restartLoading: false
			}));
	};

	public render()
	{
		const tablet = matchMedia('(max-width:1200px)');

		const {
			id,
		} = this.props.match.params;

		if (!id)
		{
			return <Redirect to={"/"}/>;
		}

		const {
			dateCreated,
			ownerGuid,
			spectators,
			pendingPlayers,
			players,
		} = this.state.gameData.game ?? {};

		if (!this.state.gameData.game || !this.state.gameData.loaded || !this.state.socketData.hasConnection)
		{
			return <ContainerProgress/>;
		}

		const {
			playerGuid
		} = this.state.userData;

		const owner = players?.[ownerGuid ?? ""];
		const amInGame = playerGuid in (players ?? {});
		const amSpectating = playerGuid in {...(spectators ?? {}), ...(pendingPlayers ?? {})};
		const title = `${unescape(owner?.nickname ?? "")}'s game`;

		const playerGuids = Object.keys(players ?? {});
		const roundsToWin = getTrueRoundsToWin(this.state.gameData.game as ClientGameItem);
		const winnerGuid = playerGuids.find(pg => (players?.[pg].wins ?? 0) >= roundsToWin);
		const canChat = (amInGame || amSpectating) && moment(dateCreated).isAfter(moment(new Date(1589260798170)));
		const width = !this.state.authContext.isSubscriber ? "33vw" : "15vw";

		return (
			<>
				<Helmet>
					<title>{title}</title>
				</Helmet>
				<div style={{width: tablet ? "100%" : `calc(100% - ${width})`}}>
					<PlayerJoinApproval/>
					<GameInner gameId={id}/>
					{winnerGuid && (
						<Dialog open={this.state.showSupport} onClose={() => this.setState({showSupport: false})}>
							<DialogContent style={{padding: "2rem"}}>
								<Typography variant={"h6"} style={{textAlign: "center"}}>
									Game over! {unescape(players?.[winnerGuid].nickname ?? "")} is the winner.
								</Typography>

								<Support/>

								{playerGuid === ownerGuid && (
									<div style={{
										marginTop: "7rem",
										textAlign: "center"
									}}>
										<LoadingButton loading={this.state.restartLoading || this.state.restartDelayed} variant={"contained"} color={"secondary"} onClick={() => this.restartClick(playerGuid)}>
											Restart this game?
										</LoadingButton>
									</div>
								)}
							</DialogContent>
						</Dialog>
					)}
					{canChat && (
						<>
							<GameChatFab showChat={amInGame || amSpectating}/>
							<ChatSidebar/>
						</>
					)}
				</div>
			</>
		);
	}
};

export default withRouter(Game);