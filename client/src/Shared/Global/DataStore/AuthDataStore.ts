import {DataStore} from "./DataStore";
import {AbcPlatform} from "../../../AllBadCards/Global/Platform/abcPlatform";
import {BackerType} from "../../../AllBadCards/Global/Platform/Contract";
import {ErrorDataStore} from "../../../AllBadCards/Global/DataStore/ErrorDataStore";

export interface IAuthContext
{
	userId: string | null;
	authorized: boolean;
	levels: BackerType[];
	loaded: boolean;
	isSubscriber: boolean;
}

const LowestBacker = BackerType["Hide Ads (Pay-what-you-want)"];

export const BackerLevelMap = {
	[BackerType.None]: [BackerType.None],
	[LowestBacker]: [LowestBacker],
	[BackerType.Sponsor]: [LowestBacker, BackerType.Sponsor],
	[BackerType.Owner]: [LowestBacker, BackerType.Sponsor, BackerType.Owner],
};

class _AuthDatastore extends DataStore<IAuthContext>
{
	public static Instance = new _AuthDatastore();

	private constructor()
	{
		super({
			authorized: false,
			userId: null,
			isSubscriber: false,
			loaded: false,
			levels: []
		});

		this.initialize();
	}

	private async initialize()
	{
		AbcPlatform.getAuthStatus()
			.then(result => {
				const status = result.status;
				const {
					levels,
					userId,
				} = status;

				const ownedLevels = levels.length
					? BackerLevelMap[levels[0]]
					: [BackerType.None];

				this.update({
					authorized: !!userId,
					userId,
					levels: ownedLevels,
					isSubscriber: (ownedLevels ?? []).includes(LowestBacker),
					loaded: true
				});
			})
			.catch(ErrorDataStore.add);
	}

	public refresh()
	{
		this.initialize();
	}

	public logOut()
	{
		AbcPlatform.logOut()
			.then(() => this.initialize());
	}

	public hasLevel(backerType: BackerType)
	{
		return this.state.levels?.indexOf(backerType) > -1;
	}

}

export const AuthDataStore = _AuthDatastore.Instance;