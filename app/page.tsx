"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

export default function Home() {
  return (
    <main className="bg-slate-50">

      {/* HERO */}
      <section className="relative h-[700px] bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500">
        <Image
          src="/image/kereta.jpg"
          alt="Kereta"
          fill
          className="object-cover opacity-40"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        <div className="relative z-10 container mx-auto h-full flex items-center px-6">
          <div className="max-w-2xl text-white">

            
            <h1 className="text-7xl font-bold leading-tight text-white drop-shadow-lg mb-4">
              Perjalanan Nyaman
              <br />
              Bersama <span className="text-yellow-300 animate-pulse">Kami</span>
            </h1>

            <p className="text-xl text-gray-100 mb-8 max-w-lg">
              Pesan tiket kereta dengan cepat, mudah, dan aman. Ribuan rute tersedia dengan harga terbaik.
            </p>
          </div>
        </div>
      </section>

      

      {/* DESTINASI */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-6">

          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-4 text-black">
              Destinasi Terpopuler
            </h2>
            <p className="text-gray-600 text-lg">Jelajahi destinasi impian Anda dengan harga spesial</p>
          </div>

          <div className="pb-20">
            <Swiper
              modules={[Pagination, Autoplay, Navigation]}
              pagination={{
                clickable: true,
                bulletActiveClass: "swiper-pagination-bullet-active",
              }}
              navigation={true}
              autoplay={{
                delay: 5000,
                disableOnInteraction: false,
              }}
              loop={true}
              breakpoints={{
                640: {
                  slidesPerView: 1,
                  spaceBetween: 20,
                },
                768: {
                  slidesPerView: 2,
                  spaceBetween: 20,
                },
                1024: {
                  slidesPerView: 3,
                  spaceBetween: 24,
                },
              }}
              className="destinasi-swiper"
            >
              {[
                {
                  city: "Jakarta",
                  image: "/image/jakarta.jpg",
                  price: "120.000",
                },
                {
                  city: "Bandung",
                  image: "/image/bandung.jpg",
                  price: "90.000",
                },
                {
                  city: "Yogyakarta",
                  image: "/image/yogya.jpg",
                  price: "180.000",
                },
                {
                  city: "Surabaya",
                  image: "/image/surabaya.jpg",
                  price: "150.000",
                },
              ].map((item) => (
                <SwiperSlide key={item.city}>
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-3 transition duration-300 border border-gray-100">
                    <div className="relative">
                      <Image
                        src={item.image}
                        alt={item.city}
                        width={500}
                        height={300}
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">Populer</div>
                    </div>

                    <div className="p-6">
                      <h3 className="font-bold text-2xl text-slate-800 mb-2">
                        {item.city}
                      </h3>

                      <div className="flex justify-between items-center">
                        <p className="text-blue-600 font-bold text-lg">
                          Rp {item.price}
                        </p>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
                          Pesan
                        </button>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </section>

     
    </main>
  );
}