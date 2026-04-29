import type { HydratedDocument, Model, Types } from "mongoose";
import mongoose, { Schema } from "mongoose";

export interface IFavorite {
  userId: Types.ObjectId;
  activityId: Types.ObjectId;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export type FavoriteDocument = HydratedDocument<IFavorite>;

const favoriteSchema = new Schema<IFavorite>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    activityId: {
      type: Schema.Types.ObjectId,
      ref: "Activity",
      required: true,
    },
    position: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

// Anti-doublon : un Utilisateur ne peut pas favoriser deux fois la même Activité.
favoriteSchema.index({ userId: 1, activityId: 1 }, { unique: true });
// Sert le tri par ordre du Profil ; non unique pour ne pas faire échouer les
// décalages de position pendant un bulkWrite (la cohérence de la séquence est
// garantie par favoriteService).
favoriteSchema.index({ userId: 1, position: 1 });

export const FavoriteModel: Model<IFavorite> =
  (mongoose.models.Favorite as Model<IFavorite> | undefined) ??
  mongoose.model<IFavorite>("Favorite", favoriteSchema);
