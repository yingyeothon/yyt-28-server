export const serverPort = +(process.env.PORT ?? "3000");
export const maxTokenCount = 10;
export const maxTopicCount = 1000;
export const maxMessageFetchCount = 500;
export const accessTokenExpiresIn = "3d";
export const adminEmail = process.env.ADMIN_EMAIL!;
