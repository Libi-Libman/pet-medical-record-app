import { defineRelations } from 'drizzle-orm';
import * as schema from './schema';

export const relations = defineRelations(schema, (r) => ({
  pets: {},
}));

// export const relations = defineRelations(schema, (r) => ({
// 	identitiesInAuth: {
// 		usersInAuth: r.one.usersInAuth({
// 			from: r.identitiesInAuth.userId,
// 			to: r.usersInAuth.id
// 		}),
// 	},
// 	usersInAuth: {
// 		identitiesInAuths: r.many.identitiesInAuth(),
// 		mfaFactorsInAuths: r.many.mfaFactorsInAuth(),
// 		oauthClientsInAuthsViaOauthAuthorizationsInAuth: r.many.oauthClientsInAuth({
// 			alias: "oauthClientsInAuth_id_usersInAuth_id_via_oauthAuthorizationsInAuth"
// 		}),
// 		oauthClientsInAuthsViaOauthConsentsInAuth: r.many.oauthClientsInAuth({
// 			alias: "oauthClientsInAuth_id_usersInAuth_id_via_oauthConsentsInAuth"
// 		}),
// 		oneTimeTokensInAuths: r.many.oneTimeTokensInAuth(),
// 		oauthClientsInAuthsViaSessionsInAuth: r.many.oauthClientsInAuth({
// 			alias: "oauthClientsInAuth_id_usersInAuth_id_via_sessionsInAuth"
// 		}),
// 		webauthnChallengesInAuths: r.many.webauthnChallengesInAuth(),
// 		webauthnCredentialsInAuths: r.many.webauthnCredentialsInAuth(),
// 		contacts: r.many.contacts({
// 			from: r.usersInAuth.id.through(r.pets.ownerId),
// 			to: r.contacts.id.through(r.pets.primaryContactId)
// 		}),
// 	},
// 	mfaAmrClaimsInAuth: {
// 		sessionsInAuth: r.one.sessionsInAuth({
// 			from: r.mfaAmrClaimsInAuth.sessionId,
// 			to: r.sessionsInAuth.id
// 		}),
// 	},
// 	sessionsInAuth: {
// 		mfaAmrClaimsInAuths: r.many.mfaAmrClaimsInAuth(),
// 		refreshTokensInAuths: r.many.refreshTokensInAuth(),
// 	},
// 	mfaChallengesInAuth: {
// 		mfaFactorsInAuth: r.one.mfaFactorsInAuth({
// 			from: r.mfaChallengesInAuth.factorId,
// 			to: r.mfaFactorsInAuth.id
// 		}),
// 	},
// 	mfaFactorsInAuth: {
// 		mfaChallengesInAuths: r.many.mfaChallengesInAuth(),
// 		usersInAuth: r.one.usersInAuth({
// 			from: r.mfaFactorsInAuth.userId,
// 			to: r.usersInAuth.id
// 		}),
// 	},
// 	oauthClientsInAuth: {
// 		usersInAuthsViaOauthAuthorizationsInAuth: r.many.usersInAuth({
// 			from: r.oauthClientsInAuth.id.through(r.oauthAuthorizationsInAuth.clientId),
// 			to: r.usersInAuth.id.through(r.oauthAuthorizationsInAuth.userId),
// 			alias: "oauthClientsInAuth_id_usersInAuth_id_via_oauthAuthorizationsInAuth"
// 		}),
// 		usersInAuthsViaOauthConsentsInAuth: r.many.usersInAuth({
// 			from: r.oauthClientsInAuth.id.through(r.oauthConsentsInAuth.clientId),
// 			to: r.usersInAuth.id.through(r.oauthConsentsInAuth.userId),
// 			alias: "oauthClientsInAuth_id_usersInAuth_id_via_oauthConsentsInAuth"
// 		}),
// 		usersInAuthsViaSessionsInAuth: r.many.usersInAuth({
// 			from: r.oauthClientsInAuth.id.through(r.sessionsInAuth.oauthClientId),
// 			to: r.usersInAuth.id.through(r.sessionsInAuth.userId),
// 			alias: "oauthClientsInAuth_id_usersInAuth_id_via_sessionsInAuth"
// 		}),
// 	},
// 	oneTimeTokensInAuth: {
// 		usersInAuth: r.one.usersInAuth({
// 			from: r.oneTimeTokensInAuth.userId,
// 			to: r.usersInAuth.id
// 		}),
// 	},
// 	refreshTokensInAuth: {
// 		sessionsInAuth: r.one.sessionsInAuth({
// 			from: r.refreshTokensInAuth.sessionId,
// 			to: r.sessionsInAuth.id
// 		}),
// 	},
// 	samlProvidersInAuth: {
// 		ssoProvidersInAuth: r.one.ssoProvidersInAuth({
// 			from: r.samlProvidersInAuth.ssoProviderId,
// 			to: r.ssoProvidersInAuth.id
// 		}),
// 	},
// 	ssoProvidersInAuth: {
// 		samlProvidersInAuths: r.many.samlProvidersInAuth(),
// 		flowStateInAuths: r.many.flowStateInAuth(),
// 		ssoDomainsInAuths: r.many.ssoDomainsInAuth(),
// 	},
// 	flowStateInAuth: {
// 		ssoProvidersInAuths: r.many.ssoProvidersInAuth({
// 			from: r.flowStateInAuth.id.through(r.samlRelayStatesInAuth.flowStateId),
// 			to: r.ssoProvidersInAuth.id.through(r.samlRelayStatesInAuth.ssoProviderId)
// 		}),
// 	},
// 	ssoDomainsInAuth: {
// 		ssoProvidersInAuth: r.one.ssoProvidersInAuth({
// 			from: r.ssoDomainsInAuth.ssoProviderId,
// 			to: r.ssoProvidersInAuth.id
// 		}),
// 	},
// 	webauthnChallengesInAuth: {
// 		usersInAuth: r.one.usersInAuth({
// 			from: r.webauthnChallengesInAuth.userId,
// 			to: r.usersInAuth.id
// 		}),
// 	},
// 	webauthnCredentialsInAuth: {
// 		usersInAuth: r.one.usersInAuth({
// 			from: r.webauthnCredentialsInAuth.userId,
// 			to: r.usersInAuth.id
// 		}),
// 	},
// 	pets: {
// 		eventsViaAllergies: r.many.events({
// 			from: r.pets.id.through(r.allergies.petId),
// 			to: r.events.id.through(r.allergies.sourceEventId),
// 			alias: "pets_id_events_id_via_allergies"
// 		}),
// 		contacts: r.many.contacts(),
// 		eventsViaDocuments: r.many.events({
// 			alias: "events_id_pets_id_via_documents"
// 		}),
// 		episodes: r.many.episodes(),
// 		eventsPetId: r.many.events({
// 			alias: "events_petId_pets_id"
// 		}),
// 		medications: r.many.medications(),
// 		documents: r.many.documents(),
// 		weightEntries: r.many.weightEntries(),
// 	},
// 	events: {
// 		petsViaAllergies: r.many.pets({
// 			alias: "pets_id_events_id_via_allergies"
// 		}),
// 		petsViaDocuments: r.many.pets({
// 			from: r.events.id.through(r.documents.eventId),
// 			to: r.pets.id.through(r.documents.petId),
// 			alias: "events_id_pets_id_via_documents"
// 		}),
// 		episodes: r.many.episodes(),
// 		pet: r.one.pets({
// 			from: r.events.petId,
// 			to: r.pets.id,
// 			alias: "events_petId_pets_id"
// 		}),
// 		medications: r.many.medications(),
// 	},
// 	contacts: {
// 		pet: r.one.pets({
// 			from: r.contacts.petId,
// 			to: r.pets.id
// 		}),
// 		usersInAuths: r.many.usersInAuth(),
// 	},
// 	episodes: {
// 		events: r.many.events({
// 			from: r.episodes.id.through(r.episodeEvents.episodeId),
// 			to: r.events.id.through(r.episodeEvents.eventId)
// 		}),
// 		pet: r.one.pets({
// 			from: r.episodes.petId,
// 			to: r.pets.id
// 		}),
// 		medications: r.many.medications(),
// 	},
// 	medicationDoseChanges: {
// 		medication: r.one.medications({
// 			from: r.medicationDoseChanges.medicationId,
// 			to: r.medications.id
// 		}),
// 	},
// 	medications: {
// 		medicationDoseChanges: r.many.medicationDoseChanges(),
// 		episode: r.one.episodes({
// 			from: r.medications.episodeId,
// 			to: r.episodes.id
// 		}),
// 		event: r.one.events({
// 			from: r.medications.originatingEventId,
// 			to: r.events.id
// 		}),
// 		pet: r.one.pets({
// 			from: r.medications.petId,
// 			to: r.pets.id
// 		}),
// 	},
// 	documents: {
// 		pets: r.many.pets({
// 			from: r.documents.id.through(r.vaccinations.documentId),
// 			to: r.pets.id.through(r.vaccinations.petId)
// 		}),
// 	},
// 	weightEntries: {
// 		pet: r.one.pets({
// 			from: r.weightEntries.petId,
// 			to: r.pets.id
// 		}),
// 	},
// 	objectsInStorage: {
// 		bucketsInStorage: r.one.bucketsInStorage({
// 			from: r.objectsInStorage.bucketId,
// 			to: r.bucketsInStorage.id
// 		}),
// 	},
// 	bucketsInStorage: {
// 		objectsInStorages: r.many.objectsInStorage(),
// 		s3MultipartUploadsInStoragesBucketId: r.many.s3MultipartUploadsInStorage({
// 			alias: "s3MultipartUploadsInStorage_bucketId_bucketsInStorage_id"
// 		}),
// 		s3MultipartUploadsInStoragesViaS3MultipartUploadsPartsInStorage: r.many.s3MultipartUploadsInStorage({
// 			from: r.bucketsInStorage.id.through(r.s3MultipartUploadsPartsInStorage.bucketId),
// 			to: r.s3MultipartUploadsInStorage.id.through(r.s3MultipartUploadsPartsInStorage.uploadId),
// 			alias: "bucketsInStorage_id_s3MultipartUploadsInStorage_id_via_s3MultipartUploadsPartsInStorage"
// 		}),
// 	},
// 	s3MultipartUploadsInStorage: {
// 		bucketsInStorage: r.one.bucketsInStorage({
// 			from: r.s3MultipartUploadsInStorage.bucketId,
// 			to: r.bucketsInStorage.id,
// 			alias: "s3MultipartUploadsInStorage_bucketId_bucketsInStorage_id"
// 		}),
// 		bucketsInStorages: r.many.bucketsInStorage({
// 			alias: "bucketsInStorage_id_s3MultipartUploadsInStorage_id_via_s3MultipartUploadsPartsInStorage"
// 		}),
// 	},
// 	vectorIndexesInStorage: {
// 		bucketsVectorsInStorage: r.one.bucketsVectorsInStorage({
// 			from: r.vectorIndexesInStorage.bucketId,
// 			to: r.bucketsVectorsInStorage.id
// 		}),
// 	},
// 	bucketsVectorsInStorage: {
// 		vectorIndexesInStorages: r.many.vectorIndexesInStorage(),
// 	},
// }))
