import * as React from "react";
import {useEffect} from "react";
import {AppBar, Container, createStyles, styled, Typography, useMediaQuery} from "@material-ui/core";
import Toolbar from "@material-ui/core/Toolbar";
import {Routes} from "./Routes";
import {UserDataStore} from "@Global/DataStore/UserDataStore";
import {Link, matchPath} from "react-router-dom";
import {useHistory} from "react-router";
import classNames from "classnames";
import Helmet from "react-helmet";
import {ErrorBoundary} from "./ErrorBoundary";
import {BrowserUtils} from "@Global/Utils/BrowserUtils";
import makeStyles from "@material-ui/core/styles/makeStyles";
import {SiteRoutes} from "@Global/Routes/Routes";
import {AppBarLeftButtons, AppBarRightButtons} from "./NavButtons";
import {colors} from "../colors";
import {AppBarGameButtons} from "./GameButtons";
import {Footer} from "./Footer";
import {AppDrawer} from "./AppDrawer";
import {ErrorModal} from "./ErrorModal";
import {HistoryDataStore} from "@Global/DataStore/HistoryDataStore";
import {useDataStore} from "@Global/Utils/HookUtils";
import {AuthDataStore} from "@Global/DataStore/AuthDataStore";

const useStyles = makeStyles(theme => createStyles({
	header: {
		position: "relative",
		zIndex: 1300
	},
	appBar: {
		background: colors.dark.main,
		color: colors.dark.contrastText,
	},
	logoIcon: {
		height: "2rem",
		width: "auto",
		paddingRight: "1rem"
	},
	logo: {
		color: colors.dark.contrastText,
		textDecoration: "none",
		display: "flex",
		alignItems: "center",
		fontWeight: 700
	},
}));

const OuterContainer = styled(Container)({
	minHeight: "75vh",
	width: "100%",
	padding: 0,
	maxWidth: "none"
});

const App: React.FC = () =>
{
	const classes = useStyles();
	const history = useHistory();
	const mobile = useMediaQuery('(max-width:768px)');
	const authData = useDataStore(AuthDataStore);
	history.listen(() => BrowserUtils.scrollToTop());
	useEffect(() =>
	{
		UserDataStore.initialize();
		history.listen(() =>
		{
			UserDataStore.initialize();
			HistoryDataStore.onChange();
		});
	}, []);

	const appBarClasses = classNames(classes.appBar, {});
	const isFamilyMode = location.hostname.startsWith("not");

	const titleDefault = isFamilyMode
		? "(Not) All Bad Cards | Play the Family Edition of All Bad Cards online!"
		: "All Bad Cards | Be rude. Be irreverent. Be Hilarious!";

	const template = isFamilyMode
		? "(Not) All Bad Cards"
		: "All Bad Cards";

	const familyEdition = isFamilyMode ? " (Family Edition)" : "";

	const isGame = !!matchPath(history.location.pathname, SiteRoutes.Game.path);
	const isSubscriber = authData.isSubscriber && authData.authorized;

	return (
		<div>
			<Helmet titleTemplate={`%s | ${template}`} defaultTitle={titleDefault}>
				<meta name="description" content={`Play All Bad Cards${familyEdition} online, for free! Play with friends over video chat, or in your house with your family. `}/>
			</Helmet>
			<OuterContainer>
				<AppBar className={classes.appBar} classes={{root: classes.header}} position="static" elevation={0}>
					<Toolbar className={appBarClasses}>
						{mobile && (
							<AppDrawer/>
						)}
						<Typography variant={mobile ? "body1" : "h5"} style={{marginRight: mobile ? "auto" : undefined}}>
							<Link to={"/"} className={classes.logo}>
								<img className={classes.logoIcon} src={"/logo-tiny-inverted.png"}/>
								{isFamilyMode && !mobile ? "(not) " : ""} {!mobile && "ALL BAD CARDS"}
							</Link>
						</Typography>
						<AppBarLeftButtons/>
						{isGame && (
							<AppBarGameButtons/>
						)}
						<AppBarRightButtons/>
					</Toolbar>
				</AppBar>
				<Container maxWidth={"xl"} style={{position: "relative", padding: isSubscriber ? "2rem 1rem 3rem" : "1rem 1rem 3rem", minHeight: "75vh"}}>
					<ErrorBoundary>
						<Routes/>
					</ErrorBoundary>
				</Container>
				<Footer/>
			</OuterContainer>
			<ErrorModal/>
		</div>
	);
};

export default App;