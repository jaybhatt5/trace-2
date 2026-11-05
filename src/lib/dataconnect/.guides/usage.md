# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createStory, updateStory, deleteStory, upsertUser, logMediaAudit, listStories, getStory, listStoriesByCategory, listStoriesByVerdict, getUserProfile } from '@trace/dataconnect';


// Operation CreateStory:  For variables, look at type CreateStoryVars in ../index.d.ts
const { data } = await CreateStory(dataConnect, createStoryVars);

// Operation UpdateStory:  For variables, look at type UpdateStoryVars in ../index.d.ts
const { data } = await UpdateStory(dataConnect, updateStoryVars);

// Operation DeleteStory:  For variables, look at type DeleteStoryVars in ../index.d.ts
const { data } = await DeleteStory(dataConnect, deleteStoryVars);

// Operation UpsertUser:  For variables, look at type UpsertUserVars in ../index.d.ts
const { data } = await UpsertUser(dataConnect, upsertUserVars);

// Operation LogMediaAudit:  For variables, look at type LogMediaAuditVars in ../index.d.ts
const { data } = await LogMediaAudit(dataConnect, logMediaAuditVars);

// Operation ListStories: 
const { data } = await ListStories(dataConnect);

// Operation GetStory:  For variables, look at type GetStoryVars in ../index.d.ts
const { data } = await GetStory(dataConnect, getStoryVars);

// Operation ListStoriesByCategory:  For variables, look at type ListStoriesByCategoryVars in ../index.d.ts
const { data } = await ListStoriesByCategory(dataConnect, listStoriesByCategoryVars);

// Operation ListStoriesByVerdict:  For variables, look at type ListStoriesByVerdictVars in ../index.d.ts
const { data } = await ListStoriesByVerdict(dataConnect, listStoriesByVerdictVars);

// Operation GetUserProfile:  For variables, look at type GetUserProfileVars in ../index.d.ts
const { data } = await GetUserProfile(dataConnect, getUserProfileVars);


```